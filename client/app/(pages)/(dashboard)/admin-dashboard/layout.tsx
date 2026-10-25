"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Headset,
  ClipboardList,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

const navigation = [
  {
    label: "Ticket Queue",
    href: "/admin-dashboard",
    icon: ClipboardList,
  },
  {
    label: "Ticket Management",
    href: "/admin-dashboard/ticket-management",
    icon: Headset,
  },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authorName, setAuthorName] = useState("Author");
  const router = useRouter();

  async function handleLogout() {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`,
        {},
        { withCredentials: true },
      );
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadAuthorName() {
      try {
        const response = await axios.get<{ name: string }>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`,
          { withCredentials: true },
        );

        if (isMounted && response.data.name) {
          setAuthorName(response.data.name);
        }
      } catch (error) {
        console.error("Failed to load author profile:", error);
      }
    }

    void loadAuthorName();

    return () => {
      isMounted = false;
    };
  }, []);

  const isActive = (href: string) =>
    href === "/admin-dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#292820]">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <button
          aria-label="Close sidebar overlay"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#e9e5dc] bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#eeeae2] px-6">
          <Link href="/admin-dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#79583c] text-white">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="block font-serif text-xl font-bold text-[#79583c]">
                BookLeaf
              </span>
              <span className="text-xs text-[#948b7e]">Admin Portal</span>
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-2 hover:bg-[#f5f1eb] lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-3 pt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a39b8d]">
            Administration
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-3">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-[#79583c] text-white shadow-sm"
                    : "text-[#716b61] hover:bg-[#f6f2ec] hover:text-[#79583c]"
                }`}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{label}</span>
                {active && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#eeeae2] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-[#f8f5ef] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5d6c4] font-semibold text-[#79583c]">
              A
            </div>
            <div>
              <p className="capitalize text-sm font-semibold">
                {authorName || null}
              </p>
              <p className="text-xs text-[#948b7e]">Admin account</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#8b5148] transition hover:bg-[#fbefed]"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:pl-64">
        {/* Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#e9e5dc] bg-white/90 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar"
              className="rounded-lg p-2 transition hover:bg-[#f5f1eb] lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div>
              <h1 className="font-serif text-lg font-semibold sm:text-xl">
                {navigation.find((item) => isActive(item.href))?.label ??
                  "Admin Workspace"}
              </h1>
              <p className="hidden text-xs text-[#948b7e] sm:block">
                Manage and monitor author support tickets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2e9dd] text-[#79583c]">
              <ShieldCheck size={20} />
            </div>
            <div className="hidden sm:block">
              <p className=" capitalize text-sm font-semibold">
                {authorName || null}
              </p>
              <p className="text-xs text-[#948b7e]">Support operations</p>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
