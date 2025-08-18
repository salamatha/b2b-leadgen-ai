import DashLayout from "../../components/DashLayout";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/signin");
    }
  }, [router]);

  return (
    <DashLayout>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2">Welcome to your dashboard.</p>
    </DashLayout>
  );
}
