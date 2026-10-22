export default function AuthorDashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <p className="mb-2 text-sm text-[#948b7e]">
          Tuesday, October 13, 2026
        </p>
        <h2 className="font-serif text-3xl font-semibold">
          Your publishing journey
        </h2>
        <p className="mt-2 text-[#716b61]">
          Manage your books, track publishing progress, and get support.
        </p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#e9e5dc] bg-white p-6">
          <BookOpenIcon />
          <p className="mt-4 text-sm text-[#948b7e]">Total Books</p>
          <h3 className="mt-1 text-3xl font-semibold">0</h3>
        </div>

        <div className="rounded-2xl border border-[#e9e5dc] bg-white p-6">
          <p className="text-sm text-[#948b7e]">In Production</p>
          <h3 className="mt-1 text-3xl font-semibold">0</h3>
        </div>

        <div className="rounded-2xl border border-[#e9e5dc] bg-white p-6">
          <p className="text-sm text-[#948b7e]">Published Books</p>
          <h3 className="mt-1 text-3xl font-semibold">0</h3>
        </div>
      </div>

      <section className="rounded-2xl border border-[#e9e5dc] bg-white p-6">
        <h3 className="font-serif text-xl font-semibold">Getting started</h3>
        <p className="mt-2 text-sm text-[#716b61]">
          Your books and publishing updates will appear here.
        </p>
      </section>
    </div>
  );
}

function BookOpenIcon() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f2e9dd] text-[#79583c]">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 7v14" />
        <path d="M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-4a3 3 0 0 0-3 2 3 3 0 0 0-3-2H5a2 2 0 0 1-2-2Z" />
      </svg>
    </div>
  );
}