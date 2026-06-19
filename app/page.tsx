export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
          French • Spanish • Hebrew • More
        </p>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          FluentDeck
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Build custom flashcard decks, study vocabulary, and review languages
          with a simple spaced-repetition system.
        </p>

        <div className="mt-8 flex gap-4">
          <a
            href="/dashboard"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-950"
          >
            Start Studying
          </a>

          <a
            href="/decks"
            className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-white"
          >
            View Decks
          </a>
        </div>
      </section>
    </main>
  );
}