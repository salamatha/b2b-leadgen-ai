import DashLayout from "../../components/DashLayout";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Agents() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/signin");
    }
  }, [router]);

  return (
    <DashLayout>
      <h1 className="text-3xl font-bold">Agents</h1>
      <p className="mt-2">Manage your LinkedIn scraping agents here.</p>
    </DashLayout>
  );
}
