import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function isPrivatePath(pathname: string) {
  return pathname === "/dashboard"
    || pathname.startsWith("/dashboard/")
    || pathname === "/agents";
}

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
  { href: "/dashboard/outreach", label: "Outreach" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashNav() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthed(!!localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (mounted && !authed && isPrivatePath(router.pathname)) {
      router.replace("/auth/signin");
    }
  }, [mounted, authed, router.pathname, router]);

  // Avoid hydration mismatch: render nothing until mounted
  if (!mounted) return null;

  // Show sidebar only on private routes and when logged in
  if (!authed || !isPrivatePath(router.pathname)) return null;

  return (
    <aside className="w-full md:w-60 shrink-0">
      <nav className="card p-3 sticky top-4">
        {items.map((it) => {
          const active = router.pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`block px-3 py-2 rounded-lg text-sm ${
                active ? "bg-slate-100 text-brand-900 font-medium" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
