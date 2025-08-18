import Link from "next/link";

export default function NavBar() {
  return (
    <header className="bg-white border-b border-slate-200/70">
      <div className="container h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-900 text-white grid place-items-center font-bold">
            L
          </div>
          <span className="font-semibold tracking-tight">B2B Leadgen AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-8 text-sm">
          <Link href="/product" className="text-slate-600 hover:text-slate-900">Product</Link>
          <Link href="/services" className="text-slate-600 hover:text-slate-900">Services</Link>
          <Link href="/pricing" className="text-slate-600 hover:text-slate-900">Pricing</Link>
          <Link href="/about" className="text-slate-600 hover:text-slate-900">About</Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link href="/auth/signin" className="btn btn-secondary">Sign in</Link>
          <Link href="/auth/signup" className="btn btn-primary">Get started</Link>
        </div>
      </div>
    </header>
  );
}
