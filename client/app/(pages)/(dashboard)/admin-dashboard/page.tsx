"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type TicketCategory =
  | "ROYALTY_PAYMENTS"
  | "ISBN_METADATA"
  | "PRINTING_QUALITY"
  | "DISTRIBUTION_AVAILABILITY"
  | "BOOK_STATUS_PRODUCTION"
  | "GENERAL_INQUIRY";
type TicketPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type AdminTicket = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  book: {
    id: string;
    title: string;
    isbn: string;
  } | null;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  messages: {
    id: string;
    body: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
      role: string;
    };
  }[];
};

type TicketsResponse = {
  message: string;
  data: AdminTicket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type TicketFilters = {
  search: string;
  status: string;
  category: string;
  priority: string;
  assigneeId: string;
  fromDate: string;
  toDate: string;
  limit: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const statuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const categories: TicketCategory[] = [
  "ROYALTY_PAYMENTS",
  "ISBN_METADATA",
  "PRINTING_QUALITY",
  "DISTRIBUTION_AVAILABILITY",
  "BOOK_STATUS_PRODUCTION",
  "GENERAL_INQUIRY",
];
const priorities: TicketPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const statusStyles: Record<TicketStatus, string> = {
  OPEN: "bg-amber-50 text-amber-700 ring-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-200",
};

const priorityStyles: Record<TicketPriority, string> = {
  CRITICAL: "bg-red-50 text-red-700 ring-red-200",
  HIGH: "bg-orange-50 text-orange-700 ring-orange-200",
  MEDIUM: "bg-amber-50 text-amber-700 ring-amber-200",
  LOW: "bg-slate-100 text-slate-600 ring-slate-200",
};

const emptyFilters: TicketFilters = {
  search: "",
  status: "",
  category: "",
  priority: "",
  assigneeId: "",
  fromDate: "",
  toDate: "",
  limit: 10,
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error: unknown) {
  const message = axios.isAxiosError(error)
    ? error.response?.data?.message
    : undefined;

  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    const messages = message.filter(
      (item): item is string => typeof item === "string",
    );
    if (messages.length) return messages.join(", ");
  }

  return "Unable to load the admin ticket queue. Please try again.";
}

function getRequestParams(filters: TicketFilters, page: number) {
  return {
    page,
    limit: filters.limit,
    ...(filters.search.trim() && { search: filters.search.trim() }),
    ...(filters.status && { status: filters.status }),
    ...(filters.category && { category: filters.category }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.assigneeId.trim() && {
      assigneeId: filters.assigneeId.trim(),
    }),
    ...(filters.fromDate && {
      fromDate: new Date(`${filters.fromDate}T00:00:00.000Z`).toISOString(),
    }),
    ...(filters.toDate && {
      toDate: new Date(`${filters.toDate}T23:59:59.999Z`).toISOString(),
    }),
  };
}

export default function AdminTicketQueuePage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [filters, setFilters] = useState<TicketFilters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<TicketFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    axios
      .get<TicketsResponse>(`${API_URL}/api/v1/admin/tickets`, {
        withCredentials: true,
        params: getRequestParams(filters, page),
      })
      .then((response) => {
        if (!isMounted) return;
        setTickets(Array.isArray(response.data.data) ? response.data.data : []);
        setPagination(
          response.data.pagination ?? {
            total: 0,
            page,
            limit: filters.limit,
            totalPages: 0,
          },
        );
        setError("");
      })
      .catch((requestError: unknown) => {
        if (isMounted) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters, page]);

  function updateDraft<K extends keyof TicketFilters>(
    field: K,
    value: TicketFilters[K],
  ) {
    setDraftFilters((current) => ({ ...current, [field]: value }));
  }

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      draftFilters.fromDate &&
      draftFilters.toDate &&
      draftFilters.fromDate > draftFilters.toDate
    ) {
      setError("Start date must be earlier than or equal to end date.");
      return;
    }

    setLoading(true);
    setError("");
    setPage(1);
    setFilters({ ...draftFilters });
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
    setLoading(true);
    setError("");
  }

  function changePage(nextPage: number) {
    setPage(nextPage);
    setLoading(true);
    setError("");
  }

  const firstTicket =
    pagination.total === 0 ? 0 : (page - 1) * filters.limit + 1;
  const lastTicket = Math.min(page * filters.limit, pagination.total);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <section className="rounded-2xl border border-[#e4e8ef] bg-white shadow-sm shadow-slate-900/[0.02]">
        <form onSubmit={applyFilters} className="space-y-4 p-5 sm:p-6">
          <label className="relative block">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a2b1]"
            />
            <input
              type="search"
              value={draftFilters.search}
              onChange={(event) => updateDraft("search", event.target.value)}
              placeholder="Search subject, description, ticket number, author name or email"
              aria-label="Search tickets"
              className="w-full rounded-xl border border-[#e1e6ed] bg-[#fbfcfd] py-3 pl-10 pr-4 text-sm text-[#273347] outline-none transition placeholder:text-[#9ba5b3] focus:border-[#7589a7] focus:ring-2 focus:ring-[#344967]/10"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Status"
              value={draftFilters.status}
              onChange={(value) => updateDraft("status", value)}
              options={statuses.map((value) => ({
                value,
                label: formatLabel(value),
              }))}
            />
            <FilterSelect
              label="Category"
              value={draftFilters.category}
              onChange={(value) => updateDraft("category", value)}
              options={categories.map((value) => ({
                value,
                label: formatLabel(value),
              }))}
            />
            <FilterSelect
              label="Priority"
              value={draftFilters.priority}
              onChange={(value) => updateDraft("priority", value)}
              options={priorities.map((value) => ({
                value,
                label: formatLabel(value),
              }))}
            />
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#586579]">
                Assignee ID
              </span>
              <input
                type="text"
                value={draftFilters.assigneeId}
                onChange={(event) =>
                  updateDraft("assigneeId", event.target.value)
                }
                placeholder="Enter admin/user ID"
                className="w-full rounded-xl border border-[#e1e6ed] bg-white px-3 py-2.5 text-sm text-[#273347] outline-none transition placeholder:text-[#a0a9b6] focus:border-[#7589a7] focus:ring-2 focus:ring-[#344967]/10"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DateFilter
              label="Created from"
              value={draftFilters.fromDate}
              onChange={(value) => updateDraft("fromDate", value)}
            />
            <DateFilter
              label="Created to"
              value={draftFilters.toDate}
              onChange={(value) => updateDraft("toDate", value)}
            />
            <FilterSelect
              label="Tickets per page"
              value={String(draftFilters.limit)}
              onChange={(value) => updateDraft("limit", Number(value))}
              options={[10, 20, 50, 100].map((value) => ({
                value: String(value),
                label: String(value),
              }))}
            />
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#243654] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b2a42]"
              >
                <Filter size={16} />
                Apply filters
              </button>
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Clear filters"
                title="Clear filters"
                className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-[#e1e6ed] text-[#68758a] transition hover:bg-[#f5f7fa] hover:text-[#344967]"
              >
                <X size={17} />
              </button>
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white shadow-sm shadow-slate-900/[0.02]">
        <div className="flex flex-col justify-between gap-2 border-b border-[#edf0f4] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h3 className="font-semibold text-[#273347]">All tickets</h3>
            <p className="mt-1 text-xs text-[#8792a3]">
              {loading
                ? "Loading ticket queue..."
                : pagination.total > 0
                  ? `Showing ${firstTicket}-${lastTicket} of ${pagination.total}`
                  : "No tickets found"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              setFilters((current) => ({ ...current }));
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-[#e1e6ed] px-3 py-2 text-xs font-semibold text-[#526078] transition hover:bg-[#f5f7fa] disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-sm text-[#758196]">
            <LoaderCircle size={26} className="animate-spin text-[#344967]" />
            Loading ticket queue...
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={27} className="text-red-600" />
            <p className="mt-3 text-sm text-[#647187]">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError("");
                setFilters((current) => ({ ...current }));
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#e1e6ed] px-4 py-2 text-sm font-semibold text-[#344967] transition hover:bg-[#f5f7fa]"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2f8] text-[#344967]">
              <ClipboardList size={23} />
            </div>
            <h4 className="mt-4 font-semibold text-[#273347]">
              No tickets found
            </h4>
            <p className="mt-2 max-w-sm text-sm text-[#8792a3]">
              Try adjusting or clearing your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#edf0f4]">
              {tickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className="p-5 transition hover:bg-[#fbfcfd] sm:p-6"
                >
                  <Link
                    href={`/admin-dashboard/ticket/${ticket.id}`}
                    className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="break-all text-xs font-semibold text-[#344967]">
                          #{ticket.ticketNumber}
                        </span>
                        <Badge
                          className={
                            statusStyles[ticket.status] ??
                            "bg-slate-100 text-slate-600 ring-slate-200"
                          }
                        >
                          {formatLabel(ticket.status)}
                        </Badge>
                        <Badge
                          className={
                            priorityStyles[ticket.priority] ??
                            "bg-slate-100 text-slate-600 ring-slate-200"
                          }
                        >
                          {formatLabel(ticket.priority)}
                        </Badge>
                      </div>
                      <h4 className="text-base font-semibold text-[#202938]">
                        {ticket.subject}
                      </h4>
                      <p className="mt-1.5 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-[#647187]">
                        {ticket.description}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#8490a1]">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          {formatDate(ticket.createdAt)}
                        </span>
                        <span>{formatLabel(ticket.category)}</span>
                        {ticket.book && (
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen size={14} />
                            {ticket.book.title}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound size={14} />
                          {ticket.assignee?.name ?? "Unassigned"}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 rounded-xl bg-[#f7f9fb] p-4 text-sm sm:grid-cols-2 xl:w-64 xl:grid-cols-1">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b1]">
                          Author
                        </p>
                        <p className="mt-1 font-medium text-[#344052]">
                          {ticket.author.name}
                        </p>
                        <p className="break-all text-xs text-[#7c889a]">
                          {ticket.author.email}
                        </p>
                        {ticket.author.phone && (
                          <p className="mt-0.5 text-xs text-[#7c889a]">
                            {ticket.author.phone}
                          </p>
                        )}
                      </div>
                      {ticket.messages[0] && (
                        <div className="border-t border-[#e6eaf0] pt-3 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0 xl:border-l-0 xl:border-t xl:pl-0 xl:pt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b1]">
                            Latest reply · {ticket.messages[0].sender.name}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#647187]">
                            {ticket.messages[0].body}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-[#edf0f4] px-5 py-4 sm:flex-row sm:px-6">
              <p className="text-xs text-[#8792a3]">
                Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#e1e6ed] px-3 py-2 text-sm font-medium text-[#526078] transition hover:bg-[#f5f7fa] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={
                    page >= pagination.totalPages || loading || !tickets.length
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[#e1e6ed] px-3 py-2 text-sm font-medium text-[#526078] transition hover:bg-[#f5f7fa] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#586579]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#e1e6ed] bg-white px-3 py-2.5 text-sm text-[#273347] outline-none transition focus:border-[#7589a7] focus:ring-2 focus:ring-[#344967]/10"
      >
        <option value="">All {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#586579]">
        {label}
      </span>
      <span className="relative block">
        <CalendarDays
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b1]"
        />
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-[#e1e6ed] bg-white py-2.5 pl-9 pr-3 text-sm text-[#273347] outline-none transition focus:border-[#7589a7] focus:ring-2 focus:ring-[#344967]/10"
        />
      </span>
    </label>
  );
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}
