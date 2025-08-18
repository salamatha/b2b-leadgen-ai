import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import DashNav from "./DashNav";
import { useAuth } from "../lib/auth";

export default function DashLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { authed } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authed) {
      router.replace("/auth/signin");
    }
    setReady(true);
  }, [authed, router]);

  if (!ready) return null;
  if (!authed) return null;

  return (
    <div className="container grid md:grid-cols-[240px_1fr] gap-6">
      <DashNav />
      <div>{children}</div>
    </div>
  );
}
