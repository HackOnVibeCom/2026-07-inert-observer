# HackOnVibe — team project

Your team's project repo. Push here → Cloudflare Pages CI/CD builds & deploys → it goes live on your team's address.

**Test the pipeline first:** edit `index.html` (a "Hello World" is enough), commit to `main` (or open a PR), and watch it appear on your live URL. That confirms the whole chain works.

Then build your AI-assisted micro-product. Static site works out of the box; add a build step if you need one.

GitDeo

GitHub Repo-to-Video Pipeline — turns a GitHub repository into a rendered showcase video, automatically.

Demo Video


https://youtu.be/ydQckSmt8ec?si=AuZjaDunLE5h70nD
Questionnaire

1. What does your application/service do?

GitDeo connects to a user's GitHub account and turns any repository they own into a short showcase video, automatically. It pulls the README summary, maps the project's file structure, and highlights key source files, then compiles all of it into a downloadable .mp4 using a rendering pipeline built on Pillow and FFmpeg. No manual editing, screen recording, or slide-building required.

2. Who is the target audience?

Developers who need to present technical work to non-technical audiences quickly: hackathon participants preparing submissions, students showcasing coursework or portfolio projects, freelance developers pitching to clients, and job seekers who want a fast way to demonstrate a project to hiring managers without them reading raw code.

3. Which countries are the expected buyers of this service?

Primarily Nigeria and other African tech hubs given the hackathon's origin and Daniel's own developer community, with natural extension to any English-speaking market with active hackathon and student-developer communities (e.g. India, the UK, the US) since the core need — explaining code to non-technical stakeholders — isn't region-specific.

4. Who are your competitors?

There is no direct competitor doing exactly this (automated GitHub-repo-to-video generation). The closest adjacent tools are:


Manual screen-recording tools (Loom, OBS) — require the developer to record and narrate themselves
README-generator tools — improve documentation but produce text, not video
Portfolio/pitch-deck builders — general-purpose, not code-aware
GitDeo's difference is that it reads the actual repository structure and content directly, with no manual input needed beyond picking a repo.

5. What is your advantage?


Zero manual effort: no recording, no slide design, no writing a script — connect GitHub, pick a repo, done
Actually reads the code: scenes are generated from the real README, file tree, and source files, not a generic template
Fast turnaround: a full video in minutes, not hours
Own it forever: every generated video is saved to the user's account, downloadable any time


Customer Journey (for video)


User lands on the homepage, clicks "Launch Workspace"
Signs up with email/password
Lands on dashboard, clicks "Connect GitHub"
Authorizes on GitHub, redirected back automatically
Sees their repo list, clicks "Generate video" on one repo
Status banner shows progress, then "rendered successfully"
Video appears in History, user clicks Download
Result: a ready-to-share .mp4 showcase of their repository
