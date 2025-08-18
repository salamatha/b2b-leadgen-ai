// frontend/pages/index.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If token exists, go to dashboard
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">
            AI-Powered B2B Lead Generation
          </h1>
          <p className="text-lg mb-8">
            Automate LinkedIn prospecting, outreach, and engagement with your
            personal AI agents.
          </p>
          <Link
            href="/auth/signin"
            className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow hover:bg-gray-100"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">About Our Product</h2>
          <p className="text-lg text-gray-600">
            We help businesses save time and generate high-quality leads by
            automating repetitive tasks on LinkedIn and email. With AI-driven
            personalization, your outreach feels natural, not spammy.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-gray-100">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-xl font-semibold mb-4">LinkedIn Automation</h3>
              <p className="text-gray-600">
                Connect, message, and follow up with decision-makers without
                manual work.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-xl font-semibold mb-4">Email Outreach</h3>
              <p className="text-gray-600">
                AI-personalized email campaigns integrated with CRM tools.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-xl font-semibold mb-4">Lead Enrichment</h3>
              <p className="text-gray-600">
                Get verified emails, phone numbers, and social profiles of your
                prospects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-xl shadow hover:shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Starter</h3>
              <p className="text-4xl font-bold mb-4">$49</p>
              <p className="text-gray-600 mb-6">Per month</p>
              <ul className="text-gray-600 space-y-2 mb-6">
                <li>✔ 1 Agent</li>
                <li>✔ 200 Leads / month</li>
                <li>✔ Email Support</li>
              </ul>
              <Link
                href="/auth/signup"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
              >
                Choose Plan
              </Link>
            </div>

            <div className="p-6 border rounded-xl shadow hover:shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Pro</h3>
              <p className="text-4xl font-bold mb-4">$99</p>
              <p className="text-gray-600 mb-6">Per month</p>
              <ul className="text-gray-600 space-y-2 mb-6">
                <li>✔ 5 Agents</li>
                <li>✔ 1000 Leads / month</li>
                <li>✔ Priority Support</li>
              </ul>
              <Link
                href="/auth/signup"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
              >
                Choose Plan
              </Link>
            </div>

            <div className="p-6 border rounded-xl shadow hover:shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Enterprise</h3>
              <p className="text-4xl font-bold mb-4">$199</p>
              <p className="text-gray-600 mb-6">Per month</p>
              <ul className="text-gray-600 space-y-2 mb-6">
                <li>✔ Unlimited Agents</li>
                <li>✔ Unlimited Leads</li>
                <li>✔ Dedicated Support</li>
              </ul>
              <Link
                href="/auth/signup"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
              >
                Choose Plan
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
