// frontend/components/DashLayout.tsx
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashNav from "./DashNav";

export default function DashLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthed(!!localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (mounted && !authed) router.replace("/auth/signin");
  }, [mounted, authed, router]);

  if (!mounted || !authed) return null;

  return (
    <div className="container py-6 grid md:grid-cols-[220px_1fr] gap-6">
      <DashNav />
      <div>{children}</div>
    </div>
  );
}
