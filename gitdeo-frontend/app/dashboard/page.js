"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, isLoggedIn } from "@/lib/api";

const STATUS_COLORS = {
  processing: "text-yellow-400",
  done: "text-emerald-400",
  failed: "text-red-400",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [repos, setRepos] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState("");
  const [generatingRepo, setGeneratingRepo] = useState(null); // full_name currently rendering
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Routing shield: no token, no dashboard.
  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const githubError = searchParams.get("github_error");
    const githubConnectedParam = searchParams.get("github_connected");
    if (githubError) {
      setStatus(`GitHub connection failed: ${githubError}`);
      setStatusKind("error");
    } else if (githubConnectedParam) {
      setStatus("GitHub connected successfully.");
      setStatusKind("success");
    }

    checkGithubStatus();
    loadHistory();
  }, []);

  async function checkGithubStatus() {
    try {
      const result = await api.githubStatus();
      setGithubConnected(result.connected);
      setGithubUsername(result.username || "");
      if (result.connected) loadRepos();
    } catch (err) {
      setStatus(err.message);
      setStatusKind("error");
    }
  }

  async function loadRepos() {
    setLoadingRepos(true);
    try {
      const data = await api.githubRepos();
      setRepos(data);
    } catch (err) {
      setStatus(err.message);
      setStatusKind("error");
    } finally {
      setLoadingRepos(false);
    }
  }

  async function loadHistory() {
    try {
      const data = await api.videoHistory();
      setHistory(data);
    } catch (err) {
      setStatus(err.message);
      setStatusKind("error");
    }
  }

  async function handleConnectGithub() {
    try {
      const { url } = await api.githubLoginUrl();
      window.location.href = url; // full browser redirect, needed for GitHub's OAuth flow
    } catch (err) {
      setStatus(err.message);
      setStatusKind("error");
    }
  }

  async function handleGenerate(repo) {
    setGeneratingRepo(repo.full_name);
    setStatus(`Scraping ${repo.full_name} and rendering frames...`);
    setStatusKind("info");
    try {
      const result = await api.generateVideo(repo.owner, repo.name);
      setStatus(`"${result.title}" rendered successfully.`);
      setStatusKind("success");
      await loadHistory();
    } catch (err) {
      setStatus(err.message);
      setStatusKind("error");
    } finally {
      setGeneratingRepo(null);
    }
  }

  async function handleDownload(video) {
    try {
      await api.downloadVideo(video.id, video.title);
    } catch (err) {
      setStatus(err.message);
      setStatusKind("error");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-6">
      {/* Left: GitHub connection + repo list */}
      <div className="console-card rounded-lg p-5 flex flex-col">
        <p className="font-mono text-xs text-slate-500 tracking-widest mb-3">GITHUB REPOSITORIES</p>

        {!githubConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <p className="text-slate-400 text-sm mb-4 max-w-xs">
              Connect your GitHub account to pull in your repositories and turn one into a showcase video.
            </p>
            <button
              onClick={handleConnectGithub}
              className="font-mono px-6 py-2.5 rounded bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"
            >
              Connect GitHub
            </button>
          </div>
        ) : (
          <>
            <p className="font-mono text-xs text-emerald-400 mb-4">Connected as @{githubUsername}</p>
            {loadingRepos ? (
              <p className="font-mono text-sm text-slate-500">Loading repositories...</p>
            ) : repos.length === 0 ? (
              <p className="font-mono text-sm text-slate-600">No repositories found on this account.</p>
            ) : (
              <ul className="space-y-2 overflow-y-auto max-h-[500px]">
                {repos.map((repo) => (
                  <li
                    key={repo.full_name}
                    className="flex items-center justify-between bg-slate-900 rounded px-4 py-3 border border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-slate-200 truncate">{repo.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{repo.description || "No description"}</p>
                    </div>
                    <button
                      onClick={() => handleGenerate(repo)}
                      disabled={generatingRepo === repo.full_name}
                      className="shrink-0 ml-3 font-mono text-xs px-3 py-1.5 rounded bg-indigo-500 text-white hover:bg-indigo-400 transition-colors disabled:opacity-50"
                    >
                      {generatingRepo === repo.full_name ? "Rendering..." : "Generate video"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Right: status + history */}
      <div className="flex flex-col gap-6">
        <div className="console-card rounded-lg p-5">
          <p className="font-mono text-xs text-slate-500 tracking-widest mb-3">STATUS</p>
          {status ? (
            <p
              className={`font-mono text-sm ${
                statusKind === "error"
                  ? "text-red-400"
                  : statusKind === "success"
                  ? "text-emerald-400"
                  : "text-yellow-400"
              }`}
            >
              {status}
            </p>
          ) : (
            <p className="font-mono text-sm text-slate-600">No activity yet. Generate a video to see it here.</p>
          )}
        </div>

        <div className="console-card rounded-lg p-5 flex-1">
          <p className="font-mono text-xs text-slate-500 tracking-widest mb-3">HISTORY</p>
          {history.length === 0 ? (
            <p className="font-mono text-sm text-slate-600">Nothing rendered yet.</p>
          ) : (
            <ul className="space-y-3">
              {history.map((video) => (
                <li
                  key={video.id}
                  className="flex items-center justify-between bg-slate-900 rounded px-4 py-3 border border-slate-800"
                >
                  <div>
                    <p className="font-mono text-sm text-slate-200">{video.title}</p>
                    <p className="text-xs text-slate-500">{video.repo_full_name}</p>
                    <p className={`font-mono text-xs mt-0.5 ${STATUS_COLORS[video.status] || "text-slate-500"}`}>
                      {video.status}
                    </p>
                  </div>
                  {video.status === "done" && (
                    <button
                      onClick={() => handleDownload(video)}
                      className="font-mono text-xs px-3 py-1.5 rounded border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                    >
                      Download
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
