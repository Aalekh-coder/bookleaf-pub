"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  UserRound,
} from "lucide-react";

type TicketMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

type SupportTicketConversation = {
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
  categoryOverridden: boolean;
  priorityOverridden: boolean;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

type ConversationResponse = {
  message: string;
  data: SupportTicketConversation;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const statusStyles: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-800 ring-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-800 ring-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CLOSED: "bg-stone-100 text-stone-700 ring-stone-200",
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

function getErrorMessage(error: unknown) {
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

  return "Unable to load this support ticket conversation. Please try again.";
}

export default function SupportTicketConversationPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [result, setResult] = useState<{
    ticketId: string;
    retry: number;
    ticket?: SupportTicketConversation;
    error?: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const loading =
    result === null ||
    result.ticketId !== ticketId ||
    result.retry !== retry;
  const ticket = loading ? null : result.ticket ?? null;
  const error = loading ? "" : result?.error ?? "";
  const conversationEntries = ticket
    ? [
        {
          id: ticket.id,
          senderId: ticket.authorId,
          body: ticket.description,
          createdAt: ticket.createdAt,
          isInitialRequest: true,
        },
        ...ticket.messages.map((message) => ({
          ...message,
          isInitialRequest: false,
        })),
      ].sort(
        (first, second) =>
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime(),
      )
    : [];

  useEffect(() => {
    let isMounted = true;

    axios
      .get<ConversationResponse>(
        `${API_URL}/api/v1/tickets/${encodeURIComponent(ticketId)}/conversation`,
        { withCredentials: true },
      )
      .then((response) => {
        if (isMounted) {
          setResult({ ticketId, retry, ticket: response.data.data });
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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <Link
        href="/author-dashboard/support-tickets"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#79583c] transition hover:text-[#593f2b]"
      >
        <ArrowLeft size={17} />
        Back to support tickets
      </Link>

      {loading ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-[#e9e5dc] bg-white text-sm text-[#716b61]">
          <LoaderCircle size={27} className="animate-spin text-[#79583c]" />
          Loading ticket conversation...
        </div>
      ) : error ? (
        <section
          role="alert"
          className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-red-200 bg-white px-6 text-center"
        >
          <AlertCircle size={30} className="text-red-600" />
          <h1 className="mt-4 text-lg font-semibold text-[#39362f]">
            Could not load conversation
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
        <>
          <section className="overflow-hidden rounded-2xl border border-[#e9e5dc] bg-white shadow-sm">
            <header className="flex items-center justify-between gap-4 border-b border-[#eeeae2] p-4 sm:p-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f6f2ec] text-[#79583c]">
                  <MessageCircle size={21} />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold text-[#292820] sm:text-xl">
                    {ticket.subject}
                  </h1>
                  <p className="mt-1 truncate text-xs text-[#948b7e]">
                    Ticket {ticket.ticketNumber} · {formatLabel(ticket.category)}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                  statusStyles[ticket.status] ??
                  "bg-stone-100 text-stone-700 ring-stone-200"
                }`}
              >
                {formatLabel(ticket.status)}
              </span>
            </header>

            <div className="space-y-5 bg-[#fbfaf8] p-4 sm:p-7">
              <p className="text-center text-xs text-[#a39b8d]">
                {conversationEntries.length}{" "}
                {conversationEntries.length === 1 ? "message" : "messages"}
              </p>
              {conversationEntries.length ? (
                <ol className="space-y-5">
                  {conversationEntries.map((entry) => {
                    const isAuthor = entry.senderId === ticket.authorId;

                    return (
                      <li
                        key={entry.id}
                        className={`flex items-end gap-2 sm:gap-3 ${
                          isAuthor ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isAuthor ? (
                          <div
                            aria-hidden="true"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e9e0d5] text-[#79583c]"
                          >
                            <MessageCircle size={15} />
                          </div>
                        ) : null}
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] ${
                            isAuthor ? "items-end" : "items-start"
                          } flex flex-col`}
                        >
                          <p
                            className={`mb-1 px-1 text-xs font-medium ${
                              isAuthor
                                ? "text-[#79583c]"
                                : "text-[#716b61]"
                            }`}
                          >
                            {isAuthor ? "You" : "BookLeaf Support"}
                            {entry.isInitialRequest ? " · Ticket request" : ""}
                          </p>
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-sm ${
                              isAuthor
                                ? "rounded-br-sm bg-[#79583c] text-white"
                                : "rounded-bl-sm border border-[#e9e5dc] bg-white text-[#39362f]"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {entry.body || "No message content."}
                            </p>
                          </div>
                          <time
                            dateTime={entry.createdAt}
                            className="mt-1.5 px-1 text-[11px] text-[#948b7e]"
                          >
                            <Clock3
                              size={12}
                              className="mr-1 inline-block align-[-2px]"
                            />
                            {formatDate(entry.createdAt)}
                          </time>
                        </div>
                        {isAuthor ? (
                          <div
                            aria-hidden="true"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#79583c] text-white"
                          >
                            <UserRound size={15} />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="rounded-xl border border-dashed border-[#ded6ca] bg-white p-6 text-center text-sm text-[#716b61]">
                  No messages in this conversation yet.
                </p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
