import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const publicNav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
];

function isPrivatePath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/agents";
}

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthed(!!localStorage.getItem("token"));
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/";
  };

  // Avoid hydration mismatch: render a neutral header until mounted
  if (!mounted) {
    return (
      <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex items-center justify-between py-3">
          <span className="font-serif text-xl text-brand-900">B2B Leadgen AI</span>
          <div className="h-8 w-32" />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex items-center justify-between py-3">
        <Link href="/" className="font-serif text-xl text-brand-900">B2B Leadgen AI</Link>

        {!isPrivatePath(router.pathname) && (
          <nav className="hidden md:flex items-center gap-5 text-sm">
            {publicNav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`hover:text-brand-900 ${
                  router.pathname === n.href ? "text-brand-900" : "text-slate-700"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {!authed ? (
            <>
              <Link href="/auth/signin" className="btn btn-secondary">Sign in</Link>
              <Link href="/auth/signup" className="btn btn-primary">Sign up</Link>
            </>
          ) : (
            <>
              {!isPrivatePath(router.pathname) && (
                <Link href="/dashboard" className="btn btn-secondary">Dashboard</Link>
              )}
              <button onClick={handleSignOut} className="btn btn-primary">Sign out</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
