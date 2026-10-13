"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MoveUpRight,
  Sparkles,
  UserRound,
  Check,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

const books = [
  { color: "#c7794b", height: 85, rotate: -2, width: 17 },
  { color: "#e0a66b", height: 99, rotate: 1, width: 13 },
  { color: "#a95f3d", height: 91, rotate: -1, width: 19 },
  { color: "#d8bb72", height: 105, rotate: 2, width: 15 },
  { color: "#71816a", height: 86, rotate: 0, width: 17 },
  { color: "#e4c58d", height: 97, rotate: -2, width: 14 },
  { color: "#b96e48", height: 112, rotate: 1, width: 18 },
  { color: "#d7a36c", height: 90, rotate: -1, width: 13 },
  { color: "#647866", height: 103, rotate: 2, width: 18 },
  { color: "#b87a49", height: 88, rotate: -1, width: 15 },
  { color: "#e1bf77", height: 98, rotate: 1, width: 19 },
  { color: "#925c3e", height: 109, rotate: -2, width: 14 },
  { color: "#c98d5b", height: 94, rotate: 1, width: 18 },
  { color: "#79836a", height: 103, rotate: -1, width: 14 },
  { color: "#d6b36f", height: 85, rotate: 2, width: 17 },
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }


    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`,
        { email, password },
        { withCredentials: true },
      );

      const { user } = response.data;

      if (!user) {
        throw new Error("User details were not returned by the server.");
      }

      if (user.role === "ADMIN") {
        router.replace("/admin-dashboard");
      } else if (user.role === "AUTHOR") {
        router.replace("/author-dashboard");
      } else {
        throw new Error("Your account has an unsupported role.");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;
        setError(
          Array.isArray(message)
            ? message.join(", ")
            : message || "Registration failed. Please try again.",
        );
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3eddf] px-5 py-10 text-[#493522] selection:bg-[#c68d5c]/30">
      {/* Paper texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(#8e7755 0.55px, transparent 0.55px)",
          backgroundSize: "7px 7px",
        }}
      />

      {/* Background lighting */}
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-[#ddc8a5]/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#c9a47c]/20 blur-3xl" />

      {/* Back button */}
      <motion.button
        type="button"
        onClick={() => window.history.back()}
        aria-label="Go back"
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.06, x: -3 }}
        whileTap={{ scale: 0.94 }}
        className="absolute left-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/80 shadow-sm backdrop-blur-md transition-colors hover:bg-white"
      >
        <ArrowLeft size={23} strokeWidth={1.5} />
      </motion.button>

      <div className="relative z-[1] mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Left: branding and animated books */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto w-full max-w-lg text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-[#c7af8c]/70 bg-[#e9deca] shadow-sm"
          >
            <Sparkles size={19} strokeWidth={1.4} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.3em" }}
            animate={{ opacity: 1, letterSpacing: "0.18em" }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-3 text-[10px] font-medium uppercase text-[#8d7658]"
          >
            A little space for big ideas
          </motion.p>

          <h1 className="font-serif text-5xl font-medium tracking-[-0.055em] sm:text-6xl">
            Publishing Made
            <br />
            <span className="italic text-[#a56d47]">Easy</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xs font-serif text-base text-[#78664f]">
            Every great story starts somewhere. Let yours begin here.
          </p>

          {/* Animated bookshelf */}
          <div className="relative mx-auto mt-10 hidden h-52 w-full max-w-md sm:block">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-x-2 bottom-4 h-24 rounded-[50%] bg-[#8e7755]/15 blur-xl"
            />

            <div className="absolute bottom-6 left-[5%] right-[5%] h-3 rounded-sm bg-[#a77a4f] shadow-[0_7px_8px_rgba(83,55,31,0.15)]" />
            <div className="absolute bottom-0 left-[10%] h-7 w-[80%] skew-x-[-15deg] bg-[#bba88b]/35" />

            <div className="absolute inset-x-[8%] bottom-9 flex h-40 items-end justify-center">
              {books.map((book, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 25, rotate: 0 }}
                  animate={{
                    opacity: 1,
                    y: [0, i % 2 === 0 ? -2 : 1, 0],
                    rotate: book.rotate,
                  }}
                  transition={{
                    opacity: {
                      delay: 0.25 + i * 0.045,
                      duration: 0.35,
                    },
                    y: {
                      delay: 0.25 + i * 0.045,
                      duration: 3 + (i % 3),
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                  style={{
                    height: book.height,
                    width: book.width,
                    backgroundColor: book.color,
                    marginLeft: i === 0 ? 0 : 2,
                    zIndex: i,
                  }}
                  className="relative shrink-0 origin-bottom rounded-t-[2px] border-x border-white/15 shadow-[2px_0_3px_rgba(70,40,20,0.13)]"
                >
                  <div className="absolute inset-y-1 left-[3px] w-px bg-white/25" />
                  <div className="absolute bottom-3 left-1 right-1 h-px bg-[#513c2a]/20" />
                </motion.div>
              ))}
            </div>

            <motion.div
              animate={{ y: [0, -7, 0], rotate: [0, 2, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute left-2 top-5 rounded-lg border border-white/70 bg-[#faf6ed]/90 px-3 py-2 font-serif text-[11px] shadow-sm"
            >
              Your story
            </motion.div>

            <motion.div
              animate={{ y: [0, 6, 0], rotate: [0, -2, 0] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute right-0 top-12 rounded-lg border border-white/70 bg-[#faf6ed]/90 px-3 py-2 font-serif text-[11px] shadow-sm"
            >
              New beginnings
            </motion.div>
          </div>

          <p className="mt-7 text-[10px] tracking-[0.16em] text-[#98866b]">
            READ · CREATE · DISCOVER
          </p>
        </motion.section>

        {/* Right: registration form */}
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.18,
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mx-auto w-full max-w-md"
        >
          <div className="rounded-[28px] border border-[#d8cbb5]/80 bg-[#faf7ef]/85 p-7 shadow-[0_22px_65px_rgba(91,65,36,0.09)] backdrop-blur-xl sm:p-9">
            <div className="mb-7">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a27850]">
                BEGIN YOUR JOURNEY
              </p>

              <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
                Create account
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#877761]">
                Make yourself at home. Your next chapter starts here.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.42, duration: 0.45 }}
              >
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-medium text-[#594630]"
                >
                  Email address
                </label>

                <div className="group flex h-12 items-center gap-3 rounded-xl border border-[#ded2bf] bg-[#fdfbf6] px-4 transition-all focus-within:border-[#a87951] focus-within:ring-4 focus-within:ring-[#a87951]/10">
                  <Mail
                    size={17}
                    className="shrink-0 text-[#a18a6b] transition-colors group-focus-within:text-[#865735]"
                    strokeWidth={1.6}
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#493522] outline-none placeholder:text-[#b6a894]"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.49, duration: 0.45 }}
              >
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-medium text-[#594630]"
                >
                  Password
                </label>

                <div className="group flex h-12 items-center gap-3 rounded-xl border border-[#ded2bf] bg-[#fdfbf6] px-4 transition-all focus-within:border-[#a87951] focus-within:ring-4 focus-within:ring-[#a87951]/10">
                  <LockKeyhole
                    size={17}
                    className="shrink-0 text-[#a18a6b] transition-colors group-focus-within:text-[#865735]"
                    strokeWidth={1.6}
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-[#493522] outline-none placeholder:text-[#b6a894]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="shrink-0 text-[#a18a6b] transition-colors hover:text-[#493522]"
                  >
                    {showPassword ? (
                      <EyeOff size={17} strokeWidth={1.6} />
                    ) : (
                      <Eye size={17} strokeWidth={1.6} />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700"
                >
                  {error}
                </motion.p>
              )}

              {/* Success message */}
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  className="flex items-start gap-2 rounded-lg border border-[#b8c8a8] bg-[#eef3e8] px-3 py-2 text-xs leading-5 text-[#49623a]"
                >
                  <Check size={15} className="mt-0.5 shrink-0" />
                  Registration UI test completed. Connect your API to create
                  your account.
                </motion.p>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.985 }}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#513b28] px-5 text-sm font-medium text-[#faf4e8] shadow-[0_7px_18px_rgba(81,59,40,0.18)] transition-colors hover:bg-[#674a31] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Creating account..." : "Create your account"}

                {!loading && (
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </motion.button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#e5dac8]" />
              <span className="font-serif text-xs italic text-[#a18b70]">
                your story starts here
              </span>
              <div className="h-px flex-1 bg-[#e5dac8]" />
            </div>

            <p className="text-center text-xs leading-6 text-[#897760]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#795234] underline decoration-[#c8a47e] underline-offset-4 transition-colors hover:text-[#ad754a]"
              >
                Sign in
              </Link>
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 flex items-center justify-center gap-2 text-[10px] tracking-[0.12em] text-[#a18d72]"
          >
            <span>MADE FOR CURIOUS MINDS</span>
            <MoveUpRight size={12} />
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}
