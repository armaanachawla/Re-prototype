import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <h1 className="font-serif text-4xl text-ink">Page not found</h1>
      <Link href="/" className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm text-ivory">
        Back to RE
      </Link>
    </main>
  );
}
