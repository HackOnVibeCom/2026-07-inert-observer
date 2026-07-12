"""
GitDeo video pipeline.

Deliberately simplified for the 6-hour build: one frame per code module,
rendered as a static "slide" (dark console card with title + code), then
stitched into an mp4 with ffmpeg's concat demuxer. This is NOT a fully
animated typewriter-style render - that is a good v2 feature once the
core flow is proven stable. A slideshow that finishes reliably beats an
animation pipeline that hangs on encoding.

Requires the ffmpeg binary to be installed on the host machine and
reachable on PATH. On Ubuntu/Debian: `sudo apt-get install ffmpeg`
"""
import os
import subprocess
import textwrap
import uuid
from PIL import Image, ImageDraw, ImageFont

FFMPEG_BINARY = os.environ.get("FFMPEG_PATH", "ffmpeg")  # falls back to PATH lookup if not set

FRAME_WIDTH = 1280
FRAME_HEIGHT = 720
SECONDS_PER_MODULE = 3
BG_COLOR = (2, 6, 23)          # slate-950
CARD_COLOR = (15, 23, 42)      # slate-900
TITLE_COLOR = (129, 140, 248)  # indigo-400
CODE_COLOR = (52, 211, 153)    # emerald-400

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "generated_videos")
FRAMES_DIR_ROOT = os.path.join(os.path.dirname(__file__), "..", "tmp_frames")


def _load_font(size: int):
    # Falls back to default bitmap font if no truetype font is on the host.
    # A missing font should never crash the render.
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def render_frame(module: dict, index: int, total: int, out_path: str):
    img = Image.new("RGB", (FRAME_WIDTH, FRAME_HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    card_margin = 60
    draw.rounded_rectangle(
        [card_margin, card_margin, FRAME_WIDTH - card_margin, FRAME_HEIGHT - card_margin],
        radius=20, fill=CARD_COLOR
    )

    title_font = _load_font(36)
    code_font = _load_font(24)
    label_font = _load_font(20)

    draw.text((card_margin + 40, card_margin + 30), f"{index + 1} / {total}", font=label_font, fill=(100, 116, 139))
    draw.text((card_margin + 40, card_margin + 70), module["title"], font=title_font, fill=TITLE_COLOR)

    wrapped = textwrap.wrap(module["body"], width=70)
    y = card_margin + 140
    for line in wrapped[:18]:  # cap lines so overflow can't push text off-frame
        draw.text((card_margin + 40, y), line, font=code_font, fill=CODE_COLOR)
        y += 32

    img.save(out_path)


def build_video(modules: list[dict], job_id: str) -> str:
    """
    Renders each module to a frame, then encodes them into an mp4.
    Returns the absolute path to the finished video file.
    Raises RuntimeError with a clear message if ffmpeg is missing or fails,
    rather than letting a raw subprocess error bubble up.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    frames_dir = os.path.join(FRAMES_DIR_ROOT, job_id)
    os.makedirs(frames_dir, exist_ok=True)

    total = len(modules)
    frame_paths = []
    for i, module in enumerate(modules):
        path = os.path.join(frames_dir, f"frame_{i:03d}.png")
        render_frame(module, i, total, path)
        frame_paths.append(path)

    # concat demuxer needs an explicit list file with per-image duration
    concat_list_path = os.path.join(frames_dir, "concat.txt")
    with open(concat_list_path, "w") as f:
        for path in frame_paths:
            f.write(f"file '{os.path.abspath(path)}'\n")
            f.write(f"duration {SECONDS_PER_MODULE}\n")
        # ffmpeg concat quirk: last file's duration is ignored unless repeated
        f.write(f"file '{os.path.abspath(frame_paths[-1])}'\n")

    output_filename = f"gitdeo_{job_id}.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    cmd = [
        FFMPEG_BINARY, "-y",
        "-f", "concat", "-safe", "0", "-i", concat_list_path,
        "-vsync", "vfr",
        "-pix_fmt", "yuv420p",
        output_path,
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    except FileNotFoundError:
        raise RuntimeError(
            f"Could not run ffmpeg at '{FFMPEG_BINARY}'. Set FFMPEG_PATH in your .env "
            "to the full path of ffmpeg.exe, or make sure ffmpeg is on your system PATH."
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError("Video encoding timed out after 120 seconds.")

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr[-500:]}")

    return os.path.abspath(output_path)
