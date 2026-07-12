"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    // No backend endpoint for this yet - wire this to a /contact route
    // on the FastAPI side, or a mail service, once you have time for it.
    setSent(true);
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-20">
      <p className="font-mono text-xs text-emerald-400 tracking-widest mb-4">CONTACT</p>
      <h1 className="text-4xl font-bold mb-8">Get in touch</h1>

      {sent ? (
        <div className="console-card rounded-lg p-6 font-mono text-emerald-400 text-sm">
          Message received. This form isn't wired to a backend yet, so nothing
          was actually sent, but the flow works.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1 font-mono">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full console-card rounded px-4 py-2.5 text-slate-100 input-focus-glow"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1 font-mono">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full console-card rounded px-4 py-2.5 text-slate-100 input-focus-glow"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1 font-mono">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full console-card rounded px-4 py-2.5 text-slate-100 input-focus-glow resize-none"
            />
          </div>
          <button
            type="submit"
            className="font-mono px-6 py-2.5 rounded bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"
          >
            Send message
          </button>
        </form>
      )}
    </div>
  );
}
