"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isLoggedIn, clearToken } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, [pathname]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  function handleLogout() {
    clearToken();
    setLoggedIn(false);
    router.push("/login");
  }

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-mono text-lg font-bold text-indigo-400 tracking-tight">
          GitDeo<span className="text-slate-500">_</span>
        </Link>

        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-mono transition-colors ${
                pathname === link.href
                  ? "text-indigo-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-mono transition-colors ${
                  pathname === "/dashboard"
                    ? "text-emerald-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-mono text-slate-400 hover:text-red-400 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-mono px-4 py-1.5 rounded border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            >
              Launch Workspace
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
