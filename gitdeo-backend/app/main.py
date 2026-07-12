"""
GitDeo backend entry point.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""
import os
import uuid
from dotenv import load_dotenv

load_dotenv()  # must run before importing app.auth, which reads GITDEO_SECRET_KEY at import time

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import init_db, get_db, User, Video
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.video import build_video
from app.github_client import (
    exchange_code_for_token, get_authenticated_username, list_repos,
    build_scene_modules, GitHubError,
)

GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

app = FastAPI(title="GitDeo API")

# Next.js dev server default port. Add your deployed frontend URL here too
# once you deploy, or the browser will silently block requests with a CORS error.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ---------- Schemas ----------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GenerateFromRepoRequest(BaseModel):
    owner: str
    repo: str


# ---------- Auth routes ----------

@app.post("/auth/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@app.get("/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email}


# ---------- GitHub OAuth routes ----------

@app.get("/github/login-url")
def github_login_url(current_user: User = Depends(get_current_user)):
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub OAuth is not configured on the server (missing GITHUB_CLIENT_ID)")
    # state carries the GitDeo user id so the callback knows who to attach
    # the GitHub token to. This is a hackathon-scope shortcut - in a real
    # production app, sign/verify this state value to stop tampering.
    from urllib.parse import quote
    redirect_uri = quote(f"{BACKEND_URL}/github/callback", safe="")
    scope = quote("repo read:user", safe="")
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scope}"
        f"&state={current_user.id}"
    )
    return {"url": url}


@app.get("/github/callback")
def github_callback(code: str, state: str, db: Session = Depends(get_db)):
    try:
        user_id = int(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        token = exchange_code_for_token(code, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
        username = get_authenticated_username(token)
    except GitHubError as e:
        return RedirectResponse(f"{FRONTEND_URL}/dashboard?github_error={str(e)}")

    user.github_token = token
    user.github_username = username
    db.commit()

    return RedirectResponse(f"{FRONTEND_URL}/dashboard?github_connected=1")


@app.get("/github/status")
def github_status(current_user: User = Depends(get_current_user)):
    return {"connected": bool(current_user.github_token), "username": current_user.github_username}


@app.get("/github/repos")
def github_repos(current_user: User = Depends(get_current_user)):
    if not current_user.github_token:
        raise HTTPException(status_code=400, detail="Connect your GitHub account first")
    try:
        return list_repos(current_user.github_token)
    except GitHubError as e:
        raise HTTPException(status_code=502, detail=str(e))


# ---------- Video generation routes ----------

@app.post("/video/generate")
def generate_video(payload: GenerateFromRepoRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.github_token:
        raise HTTPException(status_code=400, detail="Connect your GitHub account first")

    try:
        scenes = build_scene_modules(payload.owner, payload.repo, current_user.github_token)
    except GitHubError as e:
        raise HTTPException(status_code=502, detail=str(e))

    job_id = uuid.uuid4().hex[:12]
    video = Video(
        owner_id=current_user.id,
        title=payload.repo,
        repo_full_name=f"{payload.owner}/{payload.repo}",
        source_language="github_repo",
        file_path="",
        status="processing",
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    try:
        output_path = build_video(scenes, job_id)
    except RuntimeError as e:
        video.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

    video.file_path = output_path
    video.status = "done"
    db.commit()
    db.refresh(video)

    return {"id": video.id, "title": video.title, "status": video.status}


@app.get("/video/history")
def video_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    videos = db.query(Video).filter(Video.owner_id == current_user.id).order_by(Video.created_at.desc()).all()
    return [
        {
            "id": v.id, "title": v.title, "status": v.status,
            "repo_full_name": v.repo_full_name, "created_at": v.created_at.isoformat(),
        }
        for v in videos
    ]


@app.get("/video/{video_id}/download")
def download_video(video_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    video = db.query(Video).filter(Video.id == video_id, Video.owner_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.status != "done":
        raise HTTPException(status_code=409, detail=f"Video is not ready yet (status: {video.status})")
    return FileResponse(video.file_path, media_type="video/mp4", filename=f"{video.title}.mp4")


@app.get("/")
def root():
    return {"status": "GitDeo API is running"}
