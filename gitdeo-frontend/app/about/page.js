export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <p className="font-mono text-xs text-emerald-400 tracking-widest mb-4">ABOUT // SYSTEM INTENT</p>
      <h1 className="text-4xl font-bold mb-6">What GitDeo actually does</h1>
      <p className="text-slate-400 leading-relaxed max-w-2xl">
        GitDeo connects to your GitHub account and reads a repository directly,
        no copy-pasting code required. It pulls the README summary, maps the
        file tree, and pulls out a handful of the source files that best explain
        how the project works. Each of those pieces becomes a scene, and the
        scenes become a video.
      </p>

      <div className="mt-12 grid sm:grid-cols-3 gap-4">
        {[
          { step: "Connect", detail: "Authorize once, pick any repo you own" },
          { step: "Scrape", detail: "README, file tree, and key source files" },
          { step: "Render", detail: "Pillow + FFmpeg build the final .mp4" },
        ].map((s) => (
          <div key={s.step} className="console-card rounded-lg p-5">
            <p className="font-mono text-emerald-400 text-sm">{s.step}</p>
            <p className="text-slate-400 text-sm mt-1">{s.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 border-t border-slate-800 pt-12">
        <p className="font-mono text-xs text-slate-500 tracking-widest mb-6">CREATOR</p>
        <div className="console-card rounded-lg p-8 flex flex-col sm:flex-row gap-6 sm:items-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center font-mono font-bold text-slate-950 text-xl shrink-0">
            ID
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Iyanda Olawale Daniel</h2>
            <p className="text-slate-400 mt-1 text-sm leading-relaxed">
              Electrical and Electronics Engineering student, University of
              Ibadan. Builds across embedded systems, IoT, and frontend
              development. GitDeo grew out of that same interest: making
              technical work legible to people outside the codebase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
