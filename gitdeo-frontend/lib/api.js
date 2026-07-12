// Central place for talking to the GitDeo backend.
// Change this if your FastAPI server runs somewhere other than localhost:8000.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gitdeo_token");
}

export function setToken(token) {
  localStorage.setItem("gitdeo_token", token);
}

export function clearToken() {
  localStorage.removeItem("gitdeo_token");
}

export function isLoggedIn() {
  return Boolean(getToken());
}

async function request(path, { method = "GET", body, authed = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (authed) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // FastAPI puts the human-readable message in `detail`
    throw new Error(data.detail || "Something went wrong talking to the server");
  }

  return data;
}

export const api = {
  register: (email, password) =>
    request("/auth/register", { method: "POST", body: { email, password }, authed: false }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password }, authed: false }),

  me: () => request("/auth/me"),

  githubStatus: () => request("/github/status"),

  githubLoginUrl: () => request("/github/login-url"),

  githubRepos: () => request("/github/repos"),

  generateVideo: (owner, repo) =>
    request("/video/generate", { method: "POST", body: { owner, repo } }),

  videoHistory: () => request("/video/history"),

  downloadUrl: (videoId) => {
    // Direct link, browser will attach nothing - so we build a fetch-based
    // download instead of a bare href, since the endpoint needs the auth header.
    return `${API_BASE}/video/${videoId}/download`;
  },

  downloadVideo: async (videoId, filename) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/video/${videoId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Download failed");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
