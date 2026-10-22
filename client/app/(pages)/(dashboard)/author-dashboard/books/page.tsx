"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  CalendarDays,
  TrendingUp,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import CreateBookModal from "@/components/author/CreateBookModal";

type Book = {
  id: string;
  bookId: string;
  title: string;
  isbn: string;
  genre: string;
  publicationDate: string;
  status: string;
  mrp: number;
  authorRoyaltyPerCopy: number;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  lastRoyaltyPayoutDate: string | null;
  printPartner: string;
  availableOn: string[];
  authorId: string;
  createdAt: string;
  updatedAt: string;
};

type BooksResponse = {
  data: Book[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-amber-50 text-amber-700 ring-amber-200",
  IN_PRODUCTION: "bg-blue-50 text-blue-700 ring-blue-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  OUT_OF_STOCK: "bg-orange-50 text-orange-700 ring-orange-200",
  DISCONTINUED: "bg-gray-100 text-gray-600 ring-gray-200",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

const formatDate = (date: string) => {
  if (!date) return "Not scheduled";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function AuthorBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get<BooksResponse>(
        `${API_URL}/api/v1/books`,
        {
          withCredentials: true,
        },
      );

      setBooks(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;

      setError(
        typeof message === "string"
          ? message
          : "Unable to load your books. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBooks();
  }, [fetchBooks]);

  const filteredBooks = books.filter((book) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      book.title?.toLowerCase().includes(query) ||
      book.bookId?.toLowerCase().includes(query) ||
      book.isbn?.toLowerCase().includes(query) ||
      book.genre?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "ALL" || book.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const publishedCount = books.filter(
    (book) => book.status === "PUBLISHED",
  ).length;

  const productionCount = books.filter(
    (book) => book.status === "IN_PRODUCTION",
  ).length;

  const totalRoyalty = books.reduce(
    (total, book) => total + Number(book.totalRoyaltyEarned || 0),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-[#948b7e]">
            <span>Author Workspace</span>
            <ChevronRight size={15} />
            <span className="text-[#79583c]">My Books</span>
          </div>

          <h2 className="font-serif text-3xl font-semibold tracking-tight">
            My Books
          </h2>

          <p className="mt-2 text-sm text-[#81796d]">
            Manage your books, publishing status, and royalty earnings.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#79583c] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#62442d]"
        >
          <Plus size={18} />
          Create Book
        </button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Books"
          value={String(books.length)}
          description="Books in your account"
          icon={<BookOpen size={20} />}
        />

        <StatCard
          title="Published"
          value={String(publishedCount)}
          description="Available to readers"
          icon={<BookOpen size={20} />}
        />

        <StatCard
          title="In Production"
          value={String(productionCount)}
          description="Currently being produced"
          icon={<RefreshCw size={20} />}
        />

        <StatCard
          title="Total Royalty Earned"
          value={formatCurrency(totalRoyalty)}
          description="Across all your books"
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* Book list */}
      <section className="overflow-hidden rounded-2xl border border-[#e9e5dc] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#eeeae2] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-serif text-xl font-semibold">
              Your collection
            </h3>
            <p className="mt-1 text-sm text-[#948b7e]">
              {filteredBooks.length}{" "}
              {filteredBooks.length === 1 ? "book" : "books"} found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a39b8d]"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search books..."
                className="w-full rounded-xl border border-[#e9e5dc] bg-[#fcfbf9] py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#aaa295] focus:border-[#79583c] sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter books by status"
              className="rounded-xl border border-[#e9e5dc] bg-[#fcfbf9] px-4 py-2.5 text-sm outline-none focus:border-[#79583c]"
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_PRODUCTION">In Production</option>
              <option value="PUBLISHED">Published</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>

            <button
              onClick={() => void fetchBooks()}
              disabled={loading}
              title="Refresh books"
              aria-label="Refresh books"
              className="inline-flex items-center justify-center rounded-xl border border-[#e9e5dc] px-3 py-2.5 text-[#79583c] transition hover:bg-[#f8f5ef] disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <CreateBookModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onCreated={() => {
              void fetchBooks();
            }}
          />
        </div>

        {error && (
          <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Could not load books</p>
              <p className="mt-1">{error}</p>
              <button
                onClick={() => void fetchBooks()}
                className="mt-2 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-xl bg-[#f5f2ed]"
              />
            ))}
          </div>
        ) : !error && filteredBooks.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2e9dd] text-[#79583c]">
              <BookOpen size={26} />
            </div>

            <h4 className="mt-4 font-serif text-xl font-semibold">
              {books.length === 0
                ? "Your bookshelf is empty"
                : "No books found"}
            </h4>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#948b7e]">
              {books.length === 0
                ? "Create your first book to start your publishing journey."
                : "Try changing your search or status filter."}
            </p>

            {books.length === 0 && (
              <Link
                href="/author-dashboard/books/create"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#79583c] px-5 py-3 text-sm font-medium text-white hover:bg-[#62442d]"
              >
                <Plus size={17} />
                Create your first book
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {filteredBooks.map((book) => (
              <article
                key={book.id}
                className="group flex flex-col rounded-2xl border border-[#ece7de] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#cdbba6] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f2e9dd] text-[#79583c]">
                    <BookOpen size={23} strokeWidth={1.7} />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${
                      statusStyles[book.status] ??
                      "bg-gray-100 text-gray-600 ring-gray-200"
                    }`}
                  >
                    {book.status?.replaceAll("_", " ") ?? "UNKNOWN"}
                  </span>
                </div>

                <h4 className="mt-5 line-clamp-2 font-serif text-xl font-semibold leading-snug">
                  {book.title}
                </h4>

                <p className="mt-1 text-xs text-[#948b7e]">ID: {book.bookId}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-[#f8f5ef] px-2.5 py-1.5 text-xs text-[#716b61]">
                    {book.genre || "Genre not set"}
                  </span>
                  <span className="rounded-lg bg-[#f8f5ef] px-2.5 py-1.5 text-xs text-[#716b61]">
                    {book.printPartner || "Print partner not set"}
                  </span>
                </div>

                <div className="mt-5 space-y-3 border-t border-[#eeeae2] pt-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#948b7e]">ISBN</span>
                    <span className="text-right font-medium">
                      {book.isbn || "Not assigned"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#948b7e]">MRP</span>
                    <span className="font-medium">
                      {formatCurrency(Number(book.mrp || 0))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#948b7e]">Royalty per copy</span>
                    <span className="font-medium">
                      {formatCurrency(Number(book.authorRoyaltyPerCopy || 0))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#948b7e]">Copies sold</span>
                    <span className="font-medium">
                      {Number(book.totalCopiesSold || 0).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#948b7e]">Royalty earned</span>
                    <span className="font-semibold text-[#79583c]">
                      {formatCurrency(Number(book.totalRoyaltyEarned || 0))}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-[#eeeae2] pt-4 text-xs text-[#948b7e]">
                  <CalendarDays size={15} />
                  <span>Publication: {formatDate(book.publicationDate)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-center text-xs text-[#aaa295]">
        BookLeaf Author Workspace
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e9e5dc] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[#948b7e]">{title}</p>
          <h3 className="mt-2 break-words text-2xl font-semibold tracking-tight">
            {value}
          </h3>
          <p className="mt-2 text-xs text-[#aaa295]">{description}</p>
        </div>

        <div className="shrink-0 rounded-xl bg-[#f2e9dd] p-3 text-[#79583c]">
          {icon}
        </div>
      </div>
    </div>
  );
}
