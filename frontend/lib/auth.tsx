import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useRouter } from "next/router";

type AuthCtx = {
  authed: boolean;
  token: string | null;
  userId: string | null;
  setToken: (t: string | null, uid?: string | null) => void;
  signIn: (t: string, uid: string) => void;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setTokenState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const authed = !!token;

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const uid = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    setTokenState(t);
    setUserId(uid);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "userId") {
        const nt = localStorage.getItem("token");
        const nuid = localStorage.getItem("userId");
        setTokenState(nt);
        setUserId(nuid);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setToken = (t: string | null, uid?: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("token", t); else localStorage.removeItem("token");
    if (uid !== undefined) {
      setUserId(uid);
      if (uid) localStorage.setItem("userId", uid); else localStorage.removeItem("userId");
    }
  };

  const signIn = (t: string, uid: string) => { setToken(t, uid); };

  const signOut = () => {
    setToken(null, null);
    // redirect to signin from private areas
     // always send user to Home after logout
    window.location.href = "/"; // 👈 redirect to Home
    if (router.pathname.startsWith("/dashboard") || router.pathname === "/agents") {
      router.replace("/auth/signin");
    } else {
      router.replace(router.pathname);
    }
  };

  const value = useMemo<AuthCtx>(() => ({
    authed, token, userId, setToken, signIn, signOut
  }), [authed, token, userId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
