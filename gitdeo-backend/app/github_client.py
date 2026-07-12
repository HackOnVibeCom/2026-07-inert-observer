"""
GitHub integration for GitDeo.

Handles three things:
1. OAuth code -> access token exchange
2. Listing a user's repos
3. Scraping a single repo: README summary, file tree, and a handful of
   "highlight" source files to show as code modules in the video

Scoped deliberately: tree depth and highlight file count are capped so a
huge repo can't blow up render time or memory. A showcase video does not
need every file, it needs the ones that tell the story.
"""
import os
import base64
import requests

GITHUB_API = "https://api.github.com"
TREE_ENTRY_CAP = 40          # max files/folders shown in the tree scene
HIGHLIGHT_FILE_CAP = 3        # max source files pulled in as code-highlight scenes
HIGHLIGHT_LINE_CAP = 25       # max lines shown per highlighted file

SOURCE_EXTENSIONS = (
    ".py", ".js", ".jsx", ".ts", ".tsx", ".ino", ".c", ".cpp", ".h",
    ".java", ".go", ".rs", ".rb", ".php",
)


class GitHubError(Exception):
    """Raised for any GitHub API failure, with a message safe to show the user."""


def exchange_code_for_token(code: str, client_id: str, client_secret: str) -> str:
    resp = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={"client_id": client_id, "client_secret": client_secret, "code": code},
        timeout=10,
    )
    data = resp.json()
    if "access_token" not in data:
        raise GitHubError(data.get("error_description", "GitHub did not return an access token"))
    return data["access_token"]


def _headers(token: str) -> dict:
    if not token:
        return {"Accept": "application/vnd.github+json"}
    return {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}


def get_authenticated_username(token: str) -> str:
    resp = requests.get(f"{GITHUB_API}/user", headers=_headers(token), timeout=10)
    if resp.status_code != 200:
        raise GitHubError("Could not verify the GitHub account. Try connecting again.")
    return resp.json()["login"]


def list_repos(token: str) -> list[dict]:
    resp = requests.get(
        f"{GITHUB_API}/user/repos",
        headers=_headers(token),
        params={"sort": "updated", "per_page": 30},
        timeout=10,
    )
    if resp.status_code != 200:
        raise GitHubError("Could not fetch your repositories from GitHub.")
    return [
        {
            "full_name": r["full_name"],
            "name": r["name"],
            "owner": r["owner"]["login"],
            "description": r.get("description") or "",
            "private": r["private"],
            "default_branch": r["default_branch"],
        }
        for r in resp.json()
    ]


def _get_readme_summary(owner: str, repo: str, token: str) -> str:
    resp = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}/readme", headers=_headers(token), timeout=10)
    if resp.status_code != 200:
        return "No README found in this repository."
    content = base64.b64decode(resp.json()["content"]).decode("utf-8", errors="ignore")
    # Strip markdown headers/badges for a cleaner on-screen summary, keep it short
    lines = [l for l in content.splitlines() if l.strip() and not l.strip().startswith(("#", "!["))]
    summary = " ".join(lines[:6])
    return summary[:400] if summary else "This repository has a README, but no plain-text summary could be extracted."


def _get_tree(owner: str, repo: str, branch: str, token: str) -> list[str]:
    resp = requests.get(
        f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{branch}",
        headers=_headers(token),
        params={"recursive": "1"},
        timeout=10,
    )
    if resp.status_code != 200:
        raise GitHubError("Could not read this repository's file structure.")
    entries = resp.json().get("tree", [])
    paths = sorted(e["path"] for e in entries if e["type"] == "blob")
    return paths[:TREE_ENTRY_CAP]


def _pick_highlight_paths(paths: list[str]) -> list[str]:
    source_paths = [p for p in paths if p.lower().endswith(SOURCE_EXTENSIONS)]
    # Prefer conventional entry-point names first, since they usually explain the project best
    priority_names = ("main", "index", "app", "setup")
    source_paths.sort(key=lambda p: (not any(name in p.lower() for name in priority_names), len(p)))
    return source_paths[:HIGHLIGHT_FILE_CAP]


def _get_file_snippet(owner: str, repo: str, path: str, token: str) -> str:
    resp = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}", headers=_headers(token), timeout=10)
    if resp.status_code != 200:
        return "(could not read this file)"
    try:
        content = base64.b64decode(resp.json()["content"]).decode("utf-8", errors="ignore")
    except Exception:
        return "(binary or unreadable file)"
    lines = content.splitlines()[:HIGHLIGHT_LINE_CAP]
    return "\n".join(lines)


def build_scene_modules(owner: str, repo: str, token: str) -> list[dict]:
    """
    Returns a list of {title, kind, body} scenes ready for the existing
    video pipeline: intro, folder tree, then up to 3 highlighted files.
    """
    repo_resp = requests.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=_headers(token), timeout=10)
    if repo_resp.status_code != 200:
        raise GitHubError(f"Could not find repository {owner}/{repo}, or you don't have access to it.")
    repo_info = repo_resp.json()
    branch = repo_info["default_branch"]

    summary = _get_readme_summary(owner, repo, token)
    tree_paths = _get_tree(owner, repo, branch, token)
    highlight_paths = _pick_highlight_paths(tree_paths)

    scenes = [
        {
            "title": f"{repo_info['name']} — by {repo_info['owner']['login']}",
            "kind": "intro",
            "body": repo_info.get("description") or summary,
        },
        {
            "title": "Project structure",
            "kind": "tree",
            "body": "\n".join(tree_paths) if tree_paths else "(empty repository)",
        },
    ]

    for path in highlight_paths:
        snippet = _get_file_snippet(owner, repo, path, token)
        scenes.append({"title": f"Highlight: {path}", "kind": "function", "body": snippet})

    if not highlight_paths:
        scenes.append({
            "title": "No source highlights found",
            "kind": "function",
            "body": "This repo didn't have recognizable source files in the supported extensions list.",
        })

    return scenes
