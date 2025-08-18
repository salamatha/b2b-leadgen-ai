export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200/70">
      <div className="container py-8 text-sm text-slate-500 flex flex-col md:flex-row items-center justify-between gap-3">
        <div>© {new Date().getFullYear()} B2B Leadgen AI</div>
        <div className="flex items-center gap-4">
          <a className="hover:text-slate-800" href="/about">About</a>
          <a className="hover:text-slate-800" href="/product">Product</a>
          <a className="hover:text-slate-800" href="/pricing">Pricing</a>
          <a className="hover:text-slate-800" href="/services">Services</a>
        </div>
      </div>
    </footer>
  );
}
