import Link from "next/link";
import { Github, ScanSearch, Clapperboard, FolderCheck } from "lucide-react";

const features = [
  {
    label: "01",
    icon: Github,
    title: "Connect GitHub",
    body: "Securely authorize GitDeo to read your public and private repositories. No tokens to copy, no manual setup.",
  },
  {
    label: "02",
    icon: ScanSearch,
    title: "Smart repo scraping",
    body: "README, file tree, and key functions are pulled straight from the repo you pick. Nothing to paste by hand.",
  },
  {
    label: "03",
    icon: Clapperboard,
    title: "Rendered showcase",
    body: "Each scene, the intro, the structure, the highlights, becomes a frame. FFmpeg compiles them into a real .mp4.",
  },
  {
    label: "04",
    icon: FolderCheck,
    title: "Saved to your workspace",
    body: "Every render is tied to your account and sits in your history, ready to re-download any time.",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Hero */}
      <section className="pt-24 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-mono text-xs text-emerald-400 tracking-widest mb-4">
            GITHUB REPO-TO-VIDEO PIPELINE
          </p>
          <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            Your repo has a{" "}
            <span className="text-indigo-400" style={{ textShadow: "0 0 30px rgba(129,140,248,0.35)" }}>
              story.
            </span>
            <br />
            Now it has a{" "}
            <span className="text-emerald-400" style={{ textShadow: "0 0 30px rgba(52,211,153,0.35)" }}>
              showcase.
            </span>
          </h1>
          <p className="mt-6 text-slate-400 text-lg max-w-md">
            Connect your GitHub account, pick a repository, and GitDeo turns
            it into a rendered video walkthrough, scene by scene, automatically.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/login"
              className="font-mono px-6 py-3 rounded bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"
            >
              Launch Workspace →
            </Link>
            <Link
              href="/about"
              className="font-mono px-6 py-3 rounded border border-slate-700 text-slate-300 hover:border-slate-500 transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>

        {/* Floating visual preview container - now reflects the actual GitHub flow */}
        <div className="relative">
          <div className="console-card rounded-lg p-5 font-mono text-sm shadow-2xl shadow-indigo-950/50">
            <div className="flex gap-1.5 mb-4">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            </div>
            <p className="text-slate-500">// connected repository</p>
            <p className="text-indigo-400">daniel/SoilBot-IoT</p>
            <p className="text-slate-400 mt-2">README.md ✓ parsed</p>
            <p className="text-slate-400">file tree ✓ mapped (32 files)</p>
            <p className="text-slate-400">3 highlight modules ✓ selected</p>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3">
              <span className="text-indigo-400">↓ rendering scenes to video</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full" />
            </div>
          </div>
          <div className="absolute -z-10 -inset-6 bg-indigo-500/10 blur-3xl rounded-full" />
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-16 border-t border-slate-800">
        <div className="grid md:grid-cols-4 gap-px bg-slate-800 rounded-lg overflow-hidden">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="bg-slate-950 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-slate-600">{f.label}</span>
                  <Icon className="w-5 h-5 text-indigo-400" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-slate-100">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
