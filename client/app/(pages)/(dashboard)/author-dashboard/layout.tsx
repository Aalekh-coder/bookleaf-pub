"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Headset,
  UserRound,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
} from "lucide-react";
import axios from "axios";

const navigation = [
  {
    name: "Dashboard",
    href: "/author-dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "My Books",
    href: "/author-dashboard/books",
    icon: BookOpen,
  },
  {
    name: "Support Tickets",
    href: "/author-dashboard/support-tickets",
    icon: Headset,
  },
  {
    name: "My Profile",
    href: "/author-dashboard/profile",
    icon: UserRound,
  },
  {
    name: "Settings",
    href: "/author-dashboard/settings",
    icon: Settings,
  },
];

export default function AuthorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authorName, setAuthorName] = useState("Author");

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
    href === "/author-dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

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
          <Link
            href="/author-dashboard"
            className="text-2xl font-serif font-bold tracking-tight text-[#79583c]"
          >
            BookLeaf
          </Link>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 hover:bg-[#f5f1eb] lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-7 pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a39b8d]">
            Author workspace
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navigation.map(({ name, href, icon: Icon }) => {
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
                <span>{name}</span>
                {active && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#eeeae2] p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#f8f5ef] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5d6c4] font-serif font-bold text-[#79583c]">
              A
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{authorName}</p>
              <p className="text-xs text-[#948b7e]">Author</p>
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

      {/* Main content area */}
      <div className="min-h-screen lg:pl-64">
        {/* Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#e9e5dc] bg-white/90 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 hover:bg-[#f5f1eb] lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div>
              <h1 className="font-serif text-lg font-semibold sm:text-xl">
                {navigation.find((item) => isActive(item.href))?.name ??
                  "Author Workspace"}
              </h1>
              <p className="hidden text-xs text-[#948b7e] sm:block">
                Manage your publishing journey
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="relative rounded-xl border border-[#eeeae2] p-2.5 text-[#716b61] transition hover:bg-[#f8f5ef]"
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#bc7656]" />
            </button>

            <div className="hidden h-9 w-px bg-[#e9e5dc] sm:block" />

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">Welcome back, {authorName}</p>
              <p className="text-xs text-[#948b7e]">Author</p>
            </div>
          </div>
        </header>

        {/* Each author page renders here */}
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
