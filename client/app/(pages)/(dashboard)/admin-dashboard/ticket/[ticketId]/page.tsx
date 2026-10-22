"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";

type Ticket = {
  id: string;
  ticketNumber: string;
  authorId: string;
  bookId: string;
  assigneeId: string | null;
  subject: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type TicketResponse = {
  message: string;
  data: Ticket;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const statusStyles: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-800 ring-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-800 ring-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CLOSED: "bg-stone-100 text-stone-700 ring-stone-200",
};

const priorityStyles: Record<string, string> = {
  CRITICAL: "bg-red-50 text-red-800 ring-red-200",
  HIGH: "bg-orange-50 text-orange-800 ring-orange-200",
  MEDIUM: "bg-amber-50 text-amber-800 ring-amber-200",
  LOW: "bg-stone-100 text-stone-700 ring-stone-200",
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
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

function getErrorMessage(
  error: unknown,
  fallback = "Unable to load this support ticket. Please try again.",
) {
  const message = axios.isAxiosError(error)
    ? error.response?.data?.message
    : undefined;

  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    const messages = message.filter(
      (item): item is string => typeof item === "string",
    );
    if (messages.length > 0) return messages.join(", ");
  }

  return fallback;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#948b7e]">
        {label}
      </dt>
      <dd className="mt-1.5 break-all text-sm font-medium text-[#39362f]">
        {value}
      </dd>
    </div>
  );
}

export default function AdminTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [result, setResult] = useState<{
    ticketId: string;
    retry: number;
    ticket?: Ticket;
    error?: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftAssigneeId, setDraftAssigneeId] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const loading =
    result === null ||
    result.ticketId !== ticketId ||
    result.retry !== retry;
  const ticket = loading ? null : result.ticket ?? null;
  const error = loading ? "" : result?.error ?? "";

  useEffect(() => {
    let isMounted = true;

    axios
      .get<TicketResponse>(
        `${API_URL}/api/v1/admin/tickets/${encodeURIComponent(ticketId)}`,
        { withCredentials: true },
      )
      .then((response) => {
        if (isMounted) {
          setResult({ ticketId, retry, ticket: response.data.data });
          setDraftStatus(response.data.data.status);
          setDraftAssigneeId(response.data.data.assigneeId ?? "");
          setDraftNote("");
          setUpdateError("");
          setUpdateSuccess("");
        }
      })
      .catch((requestError: unknown) => {
        if (isMounted) {
          setResult({ ticketId, retry, error: getErrorMessage(requestError) });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ticketId, retry]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const response = await axios.patch<TicketResponse>(
        `${API_URL}/api/v1/admin/tickets/${encodeURIComponent(ticketId)}`,
        {
          status: draftStatus,
          assigneeId: draftAssigneeId.trim() || null,
          note: draftNote.trim(),
        },
        { withCredentials: true },
      );

      setResult({ ticketId, retry, ticket: response.data.data });
      setDraftStatus(response.data.data.status);
      setDraftAssigneeId(response.data.data.assigneeId ?? "");
      setDraftNote("");
      setUpdateSuccess(response.data.message);
    } catch (requestError: unknown) {
      setUpdateError(
        getErrorMessage(
          requestError,
          "Unable to update this support ticket. Please try again.",
        ),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
      <Link
        href="/admin-dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#79583c] transition hover:text-[#593f2b]"
      >
        <ArrowLeft size={17} />
        Back to ticket queue
      </Link>

      {loading ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-[#e9e5dc] bg-white text-sm text-[#716b61]">
          <LoaderCircle size={27} className="animate-spin text-[#79583c]" />
          Loading ticket details...
        </div>
      ) : error ? (
        <section
          role="alert"
          className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-red-200 bg-white px-6 text-center"
        >
          <AlertCircle size={30} className="text-red-600" />
          <h1 className="mt-4 text-lg font-semibold text-[#39362f]">
            Could not load ticket
          </h1>
          <p className="mt-2 max-w-lg text-sm text-[#716b61]">{error}</p>
          <button
            type="button"
            onClick={() => setRetry((current) => current + 1)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#79583c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#63472f]"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </section>
      ) : ticket ? (
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      statusStyles[ticket.status] ??
                      "bg-stone-100 text-stone-700 ring-stone-200"
                    }`}
                  >
                    {formatLabel(ticket.status)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      priorityStyles[ticket.priority] ??
                      "bg-stone-100 text-stone-700 ring-stone-200"
                    }`}
                  >
                    {formatLabel(ticket.priority)} priority
                  </span>
                </div>
                <p className="mt-4 break-all text-xs font-semibold uppercase tracking-wide text-[#948b7e]">
                  Ticket {ticket.ticketNumber}
                </p>
                <h1 className="mt-2 text-2xl font-semibold leading-tight text-[#292820] sm:text-3xl">
                  {ticket.subject}
                </h1>
                <p className="mt-3 text-sm text-[#716b61]">
                  {formatLabel(ticket.category)}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f6f2ec] text-[#79583c]">
                <ClipboardList size={23} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-base font-semibold text-[#39362f]">
              Description
            </h2>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[#5f5a51]">
              {ticket.description || "No description provided."}
            </p>
          </section>

          <section className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-base font-semibold text-[#39362f]">
              Ticket details
            </h2>
            <dl className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <UserRound
                  size={17}
                  className="mt-0.5 shrink-0 text-[#9a7758]"
                />
                <DetailItem label="Author ID" value={ticket.authorId} />
              </div>
              <div className="flex items-start gap-3">
                <BookOpen
                  size={17}
                  className="mt-0.5 shrink-0 text-[#9a7758]"
                />
                <DetailItem label="Book ID" value={ticket.bookId} />
              </div>
              <DetailItem
                label="Assignee ID"
                value={ticket.assigneeId ?? "Unassigned"}
              />
              <DetailItem label="Ticket ID" value={ticket.id} />
              <DetailItem label="Ticket number" value={ticket.ticketNumber} />
            </dl>
          </section>

          <section className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-base font-semibold text-[#39362f]">
              Update ticket
            </h2>
            <form onSubmit={handleUpdate} className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[#39362f]">
                  Status
                  <select
                    value={draftStatus}
                    onChange={(event) => setDraftStatus(event.target.value)}
                    disabled={isUpdating}
                    className="mt-2 block w-full rounded-xl border border-[#d9d2c7] bg-white px-3 py-2.5 text-sm text-[#39362f] outline-none transition focus:border-[#9a7758] focus:ring-2 focus:ring-[#9a7758]/20 disabled:opacity-60"
                  >
                    {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(
                      (status) => (
                        <option key={status} value={status}>
                          {formatLabel(status)}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block text-sm font-medium text-[#39362f]">
                  Assignee ID
                  <input
                    type="text"
                    value={draftAssigneeId}
                    onChange={(event) => setDraftAssigneeId(event.target.value)}
                    disabled={isUpdating}
                    placeholder="Enter an active admin's ID"
                    className="mt-2 block w-full rounded-xl border border-[#d9d2c7] bg-white px-3 py-2.5 text-sm text-[#39362f] outline-none transition placeholder:text-[#a59d91] focus:border-[#9a7758] focus:ring-2 focus:ring-[#9a7758]/20 disabled:opacity-60"
                  />
                  <span className="mt-1.5 block text-xs font-normal text-[#716b61]">
                    Leave blank to unassign this ticket.
                  </span>
                </label>
              </div>

              <label className="block text-sm font-medium text-[#39362f]">
                Note
                <textarea
                  value={draftNote}
                  onChange={(event) => setDraftNote(event.target.value)}
                  disabled={isUpdating}
                  maxLength={500}
                  rows={3}
                  placeholder="Add a note for this status change"
                  className="mt-2 block w-full resize-y rounded-xl border border-[#d9d2c7] bg-white px-3 py-2.5 text-sm text-[#39362f] outline-none transition placeholder:text-[#a59d91] focus:border-[#9a7758] focus:ring-2 focus:ring-[#9a7758]/20 disabled:opacity-60"
                />
                <span className="mt-1.5 block text-xs font-normal text-[#716b61]">
                  The note is saved to the status history when the status
                  changes. Maximum 500 characters.
                </span>
              </label>

              {updateError ? (
                <p role="alert" className="text-sm font-medium text-red-700">
                  {updateError}
                </p>
              ) : null}
              {updateSuccess ? (
                <p
                  role="status"
                  className="flex items-center gap-2 text-sm font-medium text-emerald-700"
                >
                  <CheckCircle2 size={16} />
                  {updateSuccess}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#79583c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#63472f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdating ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {isUpdating ? "Saving changes..." : "Save changes"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-base font-semibold text-[#39362f]">
              Timeline
            </h2>
            <dl className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3">
                <CalendarDays
                  size={17}
                  className="mt-0.5 shrink-0 text-[#9a7758]"
                />
                <DetailItem
                  label="Created"
                  value={formatDate(ticket.createdAt)}
                />
              </div>
              <div className="flex items-start gap-3">
                <Clock3
                  size={17}
                  className="mt-0.5 shrink-0 text-[#9a7758]"
                />
                <DetailItem
                  label="Last updated"
                  value={formatDate(ticket.updatedAt)}
                />
              </div>
              <DetailItem
                label="Resolved"
                value={formatDate(ticket.resolvedAt)}
              />
              <DetailItem label="Closed" value={formatDate(ticket.closedAt)} />
            </dl>
          </section>
        </div>
      ) : null}
    </main>
  );
}
