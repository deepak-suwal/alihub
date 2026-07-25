import Link from "next/link";
import { ShieldIcon, TruckIcon, TagIcon } from "@/components/ui/icons";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <Feature icon={<TagIcon className="h-5 w-5" />} title="Priced in NPR">
            Live Alibaba prices converted to Nepali rupees with duties and margin built in.
          </Feature>
          <Feature icon={<ShieldIcon className="h-5 w-5" />} title="Local payments">
            Pay securely with ConnectIPS or Fonepay — no international cards required.
          </Feature>
          <Feature icon={<TruckIcon className="h-5 w-5" />} title="Sourced globally">
            Millions of verified products from Alibaba suppliers, delivered to Nepal.
          </Feature>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 text-sm text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Alihub. B2B sourcing for Nepal.</p>
          <nav className="flex gap-5">
            <Link href="/" className="hover:text-ink-700">
              Browse
            </Link>
            <Link href="/cart" className="hover:text-ink-700">Cart</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        <p className="mt-1 text-sm text-ink-500">{children}</p>
      </div>
    </div>
  );
}
