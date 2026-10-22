"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import {
  X,
  BookOpen,
  LoaderCircle,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type CreateBookModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const initialForm = {
  bookId: "",
  title: "",
  isbn: "",
  genre: "",
  mrp: "",
  authorRoyaltyPerCopy: "",
  publicationDate: "",
  printPartner: "In-House",
  availableOn: ["Amazon", "BookLeaf"],
};

const platforms = ["Amazon", "BookLeaf"];

export default function CreateBookModal({
  open,
  onClose,
  onCreated,
}: CreateBookModalProps) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isbnError, setIsbnError] = useState("");
  const [success, setSuccess] = useState(false);

  function isValidISBN(value: string): boolean {
    const isbn = value.replace(/[-\s]/g, "");

    if (/^\d{13}$/.test(isbn)) {
      const sum = [...isbn].reduce(
        (total, digit, index) =>
          total + Number(digit) * (index % 2 === 0 ? 1 : 3),
        0,
      );

      return sum % 10 === 0;
    }

    if (/^\d{9}[\dX]$/i.test(isbn)) {
      const sum = [...isbn].reduce(
        (total, char, index) =>
          total +
          (char.toUpperCase() === "X" ? 10 : Number(char)) * (10 - index),
        0,
      );

      return sum % 11 === 0;
    }

    return false;
  }

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
    if (field === "isbn") setIsbnError("");
  }

  function togglePlatform(platform: string) {
    setForm((previous) => ({
      ...previous,
      availableOn: previous.availableOn.includes(platform)
        ? previous.availableOn.filter((item) => item !== platform)
        : [...previous.availableOn, platform],
    }));
  }

  function handleClose() {
    if (loading) return;

    setError("");
    setIsbnError("");
    setSuccess(false);
    setForm(initialForm);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (form.availableOn.length === 0) {
      setError("Select at least one platform.");
      return;
    }

    const mrp = Number(form.mrp);
    const royalty = Number(form.authorRoyaltyPerCopy);

    if (!Number.isFinite(mrp) || mrp <= 0) {
      setError("MRP must be greater than zero.");
      return;
    }

    if (!Number.isFinite(royalty) || royalty < 0) {
      setError("Royalty per copy must be zero or greater.");
      return;
    }

    if (!isValidISBN(form.isbn)) {
      setError("Please enter a valid ISBN-10 or ISBN-13.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_URL}/api/v1/books`,
        {
          bookId: form.bookId.trim(),
          title: form.title.trim(),
          isbn: form.isbn.trim(),
          genre: form.genre.trim(),
          mrp,
          authorRoyaltyPerCopy: royalty,
          publicationDate: new Date(
            `${form.publicationDate}T00:00:00.000Z`,
          ).toISOString(),
          printPartner: form.printPartner,
          availableOn: form.availableOn,
        },
        { withCredentials: true },
      );

      setSuccess(true);
      onCreated();

      setTimeout(() => {
        setForm(initialForm);
        setSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      const responseMessage = axios.isAxiosError(err)
        ? err.response?.data?.message
        : undefined;
      const messages = Array.isArray(responseMessage)
        ? responseMessage.filter(
            (message): message is string => typeof message === "string",
          )
        : typeof responseMessage === "string"
          ? [responseMessage]
          : [];
      const isbnValidationFailed = messages.some((message) =>
        /^isbn\s+must be an ISBN$/i.test(message),
      );

      if (isbnValidationFailed) {
        setIsbnError(
          "Enter a valid ISBN-10 or ISBN-13, including the correct check digit.",
        );
      }

      const otherMessages = messages.filter(
        (message) => !/^isbn\s+must be an ISBN$/i.test(message),
      );
      setError(
        otherMessages.length > 0
          ? otherMessages.join(", ")
          : isbnValidationFailed
            ? ""
            : "Unable to create the book. Please check your details and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleClose();
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-book-title"
            className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e9e0d5] bg-[#fffdf9] shadow-2xl"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eee6dc] bg-[#fffdf9]/95 px-5 py-5 backdrop-blur sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2e8dc] text-[#79583c]">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h2
                    id="create-book-title"
                    className="font-serif text-2xl font-semibold text-[#30291f]"
                  >
                    Create a book
                  </h2>
                  <p className="mt-1 text-xs text-[#948b7e]">
                    Add a new title to your collection
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                aria-label="Close create book modal"
                className="rounded-xl p-2 text-[#827769] transition hover:bg-[#f2e8dc] disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
              {error && (
                <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 size={18} />
                  Book created successfully!
                </div>
              )}

              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#a09484]">
                  Book information
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Book ID"
                    required
                    placeholder="e.g. BOOK-002"
                    value={form.bookId}
                    onChange={(v) => updateField("bookId", v)}
                  />

                  <Field
                    label="Book title"
                    required
                    placeholder="Enter book title"
                    value={form.title}
                    onChange={(v) => updateField("title", v)}
                  />

                  <Field
                    id="isbn"
                    label="ISBN"
                    required
                    placeholder="e.g. 9780306406157"
                    value={form.isbn}
                    onChange={(v) => updateField("isbn", v)}
                    error={isbnError}
                  />

                  <Field
                    label="Genre"
                    required
                    placeholder="e.g. Fiction"
                    value={form.genre}
                    onChange={(v) => updateField("genre", v)}
                  />
                </div>
              </div>

              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#a09484]">
                  Pricing and publication
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="MRP (₹)"
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="19.99"
                    value={form.mrp}
                    onChange={(v) => updateField("mrp", v)}
                  />

                  <Field
                    label="Royalty per copy (₹)"
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="5.25"
                    value={form.authorRoyaltyPerCopy}
                    onChange={(v) => updateField("authorRoyaltyPerCopy", v)}
                  />

                  <Field
                    label="Publication date"
                    required
                    type="date"
                    value={form.publicationDate}
                    onChange={(v) => updateField("publicationDate", v)}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#50473b]">
                      Print partner <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.printPartner}
                      onChange={(e) =>
                        updateField("printPartner", e.target.value)
                      }
                      className="w-full rounded-xl border border-[#e5ddd1] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#79583c] focus:ring-2 focus:ring-[#79583c]/10"
                    >
                      <option value="In-House">In-House</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-[#50473b]">
                  Available on <span className="text-red-500">*</span>
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {platforms.map((platform) => {
                    const checked = form.availableOn.includes(platform);

                    return (
                      <label
                        key={platform}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                          checked
                            ? "border-[#a58a6b] bg-[#f8f2e9]"
                            : "border-[#e5ddd1] bg-white hover:bg-[#fcfaf6]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePlatform(platform)}
                          className="h-4 w-4 accent-[#79583c]"
                        />
                        <span className="text-sm font-medium text-[#50473b]">
                          {platform}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#eee6dc] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="rounded-xl border border-[#e5ddd1] px-5 py-3 text-sm font-medium text-[#716b61] transition hover:bg-[#f7f3ed] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || success}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#79583c] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#62442d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Creating...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 size={17} />
                      Created
                    </>
                  ) : (
                    <>
                      <BookOpen size={17} />
                      Create Book
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  min,
  step,
  error,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: string;
  step?: string;
  error?: string;
}) {
  const fieldId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div>
      <label
        htmlFor={fieldId}
        className="mb-2 block text-sm font-medium text-[#50473b]"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        {type === "date" && (
          <CalendarDays
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a09484]"
          />
        )}

        <input
          id={fieldId}
          type={type}
          required={required}
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-[#b0a698] focus:ring-2 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
              : "border-[#e5ddd1] focus:border-[#79583c] focus:ring-[#79583c]/10"
          } ${type === "date" ? "pl-10" : ""}`}
        />
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs leading-5 text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
