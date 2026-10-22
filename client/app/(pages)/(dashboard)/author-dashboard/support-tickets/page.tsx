"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headset,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

type SupportTicket = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  book: {
    id: string;
    title: string;
    isbn: string;
  } | null;
  messages: unknown[];
};

type TicketsResponse = {
  data: SupportTicket[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type BookOption = {
  id: string;
  title: string;
};

type BooksResponse = {
  data: BookOption[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const statusStyles: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-700 ring-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-stone-100 text-stone-600 ring-stone-200",
};

const ticketStatuses = [
  { value: "ALL", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

function getTicketErrorMessage(err: unknown) {
  const message = axios.isAxiosError(err) ? err.response?.data?.message : null;

  return typeof message === "string"
    ? message
    : "Unable to load your support tickets. Please try again.";
}

function requestTickets() {
  return axios.get<TicketsResponse>(
    `${API_URL}/api/v1/tickets/my-tickets`,
    { withCredentials: true },
  );
}

function getRequestErrorMessage(
  err: unknown,
  fallback: string,
): string {
  const message = axios.isAxiosError(err) ? err.response?.data?.message : null;

  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    const messages = message.filter(
      (item): item is string => typeof item === "string",
    );
    if (messages.length > 0) return messages.join(", ");
  }

  return fallback;
}

function requestBooks() {
  return axios.get<BooksResponse>(`${API_URL}/api/v1/books/book-name`, {
    withCredentials: true,
  });
}

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
  }).format(date);
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [raiseTicketOpen, setRaiseTicketOpen] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const response = await requestTickets();
      setTickets(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      setError(getTicketErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    requestTickets()
      .then((response) => {
        if (isMounted) {
          setTickets(
            Array.isArray(response.data.data) ? response.data.data : [],
          );
        }
      })
      .catch((err: unknown) => {
        if (isMounted) setError(getTicketErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const query = search.trim().toLowerCase();
    const matchesStatus =
      statusFilter === "ALL" || ticket.status === statusFilter;

    const matchesSearch =
      !query ||
      ticket.subject.toLowerCase().includes(query) ||
      ticket.ticketNumber.toLowerCase().includes(query) ||
      ticket.description.toLowerCase().includes(query) ||
      ticket.book?.title.toLowerCase().includes(query)

    return matchesStatus && matchesSearch;
  });

  const openCount = tickets.filter((ticket) => ticket.status === "OPEN").length;
  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS",
  ).length;
  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-[#948b7e]">
            <span>Author Workspace</span>
            <ChevronRight size={15} />
            <span className="text-[#79583c]">Support Tickets</span>
          </div>
          <h2 className="font-serif text-3xl font-semibold tracking-tight">
            Support Tickets
          </h2>
          <p className="mt-2 text-sm text-[#81796d]">
            Keep track of your questions and updates from our support team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRaiseTicketOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#79583c] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#62442d]"
        >
          <Plus size={18} />
          Raise Ticket
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total tickets"
          value={String(tickets.length)}
          icon={<Headset size={20} />}
        />
        <SummaryCard
          title="Open"
          value={String(openCount)}
          icon={<Clock3 size={20} />}
        />
        <SummaryCard
          title="In progress"
          value={String(inProgressCount)}
          icon={<RefreshCw size={20} />}
        />
        <SummaryCard
          title="Resolved"
          value={String(resolvedCount)}
          icon={<CheckCircle2 size={20} />}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e9e5dc] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#eeeae2] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="font-serif text-xl font-semibold">Your tickets</h3>
            <p className="mt-1 text-sm text-[#948b7e]">
              {filteredTickets.length}{" "}
              {filteredTickets.length === 1 ? "ticket" : "tickets"} found
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <label className="flex w-full items-center gap-2 rounded-xl border border-[#e9e5dc] bg-[#fffdf9] px-3 py-2.5 sm:w-auto">
              <span className="shrink-0 text-xs font-medium text-[#81796d]">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter tickets by status"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#292820] outline-none sm:flex-initial"
              >
                {ticketStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex w-full items-center gap-2 rounded-xl border border-[#e9e5dc] bg-[#fffdf9] px-3 py-2.5 sm:max-w-xs">
              <MessageCircle size={17} className="shrink-0 text-[#a39b8d]" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tickets"
                aria-label="Search support tickets"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#a39b8d]"
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-sm text-[#81796d]">
            <LoaderCircle size={25} className="animate-spin text-[#79583c]" />
            Loading your tickets...
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={28} className="text-[#a65a4c]" />
            <p className="mt-3 max-w-md text-sm text-[#716b61]">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError("");
                void fetchTickets();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#e9e5dc] px-4 py-2 text-sm font-medium text-[#79583c] transition hover:bg-[#f8f5ef]"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="divide-y divide-[#eeeae2]">
            {filteredTickets.map((ticket) => (
              <article
                key={ticket.id}
                className="p-5 transition hover:bg-[#fffdf9] sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          statusStyles[ticket.status] ??
                          "bg-stone-100 text-stone-600 ring-stone-200"
                        }`}
                      >
                        {formatLabel(ticket.status)}
                      </span>
                    
                    </div>

                    <h4 className="font-serif text-lg font-semibold text-[#292820]">
                      {ticket.subject}
                    </h4>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#716b61]">
                      {ticket.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#948b7e]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        Created {formatDate(ticket.createdAt)}
                      </span>
                      {ticket.book && (
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen size={14} />
                          {ticket.book.title}
                        </span>
                      )}
                      <span>{formatLabel(ticket.category)}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs font-medium text-[#948b7e]">
                      Ticket number
                    </p>
                    <p className="mt-1 break-all text-xs font-semibold text-[#79583c]">
                      {ticket.ticketNumber}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#948b7e] sm:justify-end">
                      <MessageCircle size={14} />
                      {ticket.messages.length}{" "}
                      {ticket.messages.length === 1 ? "reply" : "replies"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2e9dd] text-[#79583c]">
              <Headset size={23} />
            </div>
            <h4 className="mt-4 font-serif text-lg font-semibold">
              {search || statusFilter !== "ALL"
                ? "No matching tickets"
                : "No support tickets yet"}
            </h4>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#81796d]">
              {search || statusFilter !== "ALL"
                ? "Try changing the status filter or search term to find a ticket."
                : "Your support requests and their latest updates will appear here."}
            </p>
          </div>
        )}
      </section>

      <AnimatePresence>
        {raiseTicketOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setRaiseTicketOpen(false);
              }
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="raise-ticket-title"
              className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#e9e0d5] bg-[#fffdf9] p-6 shadow-2xl sm:p-7"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <RaiseTicketForm
                onClose={() => setRaiseTicketOpen(false)}
                onCreated={() => {
                  setLoading(true);
                  setError("");
                  void fetchTickets();
                }}
              />
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RaiseTicketForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [books, setBooks] = useState<BookOption[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [bookError, setBookError] = useState("");
  const [bookId, setBookId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    requestBooks()
      .then((response) => {
        if (isMounted) {
          setBooks(Array.isArray(response.data.data) ? response.data.data : []);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setBookError(
            getRequestErrorMessage(
              err,
              "Unable to load your books. Please try again.",
            ),
          );
        }
      })
      .finally(() => {
        if (isMounted) setBooksLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      await axios.post(
        `${API_URL}/api/v1/tickets`,
        {
          bookId,
          subject: subject.trim(),
          description: description.trim(),
        },
        { withCredentials: true },
      );

      setSuccess(true);
      onCreated();
    } catch (err) {
      setSubmitError(
        getRequestErrorMessage(
          err,
          "Unable to create your ticket. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        disabled={submitting}
        className="absolute right-4 top-4 rounded-lg p-2 text-[#81796d] transition hover:bg-[#f5f1eb] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <X size={19} />
      </button>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2e8dc] text-[#79583c]">
        <Headset size={23} />
      </div>
      <h3
        id="raise-ticket-title"
        className="mt-5 font-serif text-2xl font-semibold"
      >
        Raise a Ticket
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#716b61]">
        Tell us what you need help with and select the related book.
      </p>

      {success ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 font-semibold text-emerald-800">
            <CheckCircle2 size={19} />
            Ticket created successfully
          </div>
          <p className="mt-2 text-sm text-emerald-700">
            Your new ticket is now listed with your support requests.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-xl bg-[#79583c] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#62442d]"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="ticket-book"
              className="mb-2 block text-sm font-medium text-[#51483e]"
            >
              Book <span className="text-[#a65a4c]">*</span>
            </label>
            {booksLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-[#e9e5dc] bg-white px-3 py-3 text-sm text-[#81796d]">
                <LoaderCircle
                  size={17}
                  className="animate-spin text-[#79583c]"
                />
                Loading your books...
              </div>
            ) : bookError ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {bookError}
              </div>
            ) : books.length === 0 ? (
              <div className="rounded-xl border border-[#e9e5dc] bg-white p-3 text-sm text-[#81796d]">
                No books are available to select.
              </div>
            ) : (
              <select
                id="ticket-book"
                value={bookId}
                onChange={(event) => setBookId(event.target.value)}
                required
                className="w-full rounded-xl border border-[#e9e5dc] bg-white px-3 py-3 text-sm text-[#292820] outline-none transition focus:border-[#a98a6e] focus:ring-2 focus:ring-[#79583c]/15"
              >
                <option value="" disabled>
                  Select a book
                </option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} — {book.id}
                  </option>
                ))}
              </select>
            )}
            {!booksLoading && books.length > 0 && (
              <p className="mt-1.5 text-xs text-[#948b7e]">
                The book ID is shown with each title for reference.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="ticket-subject"
              className="mb-2 block text-sm font-medium text-[#51483e]"
            >
              Subject <span className="text-[#a65a4c]">*</span>
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
              maxLength={200}
              placeholder="Briefly describe your issue"
              className="w-full rounded-xl border border-[#e9e5dc] bg-white px-3 py-3 text-sm outline-none transition placeholder:text-[#a39b8d] focus:border-[#a98a6e] focus:ring-2 focus:ring-[#79583c]/15"
            />
          </div>

          <div>
            <label
              htmlFor="ticket-description"
              className="mb-2 block text-sm font-medium text-[#51483e]"
            >
              Description <span className="text-[#a65a4c]">*</span>
            </label>
            <textarea
              id="ticket-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={5}
              placeholder="Share the details of your request"
              className="w-full resize-y rounded-xl border border-[#e9e5dc] bg-white px-3 py-3 text-sm outline-none transition placeholder:text-[#a39b8d] focus:border-[#a98a6e] focus:ring-2 focus:ring-[#79583c]/15"
            />
          </div>

          {submitError && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {submitError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-[#e9e5dc] px-5 py-3 text-sm font-medium text-[#716b61] transition hover:bg-[#f8f5ef] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                booksLoading ||
                !!bookError ||
                books.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#79583c] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#62442d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <LoaderCircle size={17} className="animate-spin" />
              )}
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e9e5dc] bg-white p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2e9dd] text-[#79583c]">
        {icon}
      </div>
      <p className="mt-4 text-sm text-[#948b7e]">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-[#292820]">{value}</p>
    </div>
  );
}
