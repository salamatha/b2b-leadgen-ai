import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../lib/auth";

function isPrivatePath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/agents";
}

export default function Header() {
  const { authed, signOut } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex items-center justify-between py-3">
        <Link href="/" className="font-serif text-xl text-brand-900">B2B Leadgen AI</Link>

        <div className="flex items-center gap-3">
          {authed && <Link href="/agents" className="text-sm text-slate-700 hover:text-brand-900">Agents</Link>}

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
              <button onClick={signOut} className="btn btn-primary">Sign out</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
