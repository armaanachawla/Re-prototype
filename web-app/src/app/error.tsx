"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="text-sm text-taupe">RE concept prototype</p>
      <h1 className="mt-3 font-serif text-4xl text-ink">Something went wrong.</h1>
      <p className="mt-3 max-w-md text-taupe">The prototype hit an unexpected error. No data is stored, so nothing has been lost.</p>
      <button type="button" onClick={reset} className="mt-8 rounded-full bg-ink px-5 py-2.5 text-sm text-ivory">
        Try again
      </button>
    </main>
  );
}
