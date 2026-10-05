import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { signOut } from "./login/actions";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LPU Assignment & Rubric Designer",
  description:
    "Generate LPU-compliant assignment briefs and grading rubrics from the Designing Assignments and Assessment Rubrics in the AI Era guideline.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();

  return (
    <html lang="en" className={`${publicSans.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-serif text-lg font-semibold text-ink">
              LPU Assignment &amp; Rubric Designer
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              {user ? (
                <>
                  <Link href="/generate" className="font-medium text-ink-soft hover:text-ink">
                    New assignment
                  </Link>
                  <Link href="/history" className="font-medium text-ink-soft hover:text-ink">
                    History
                  </Link>
                  <span className="hidden text-ink-faint sm:inline">{user.email}</span>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:border-ink-faint hover:bg-raised"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:border-ink-faint hover:bg-raised"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line px-6 py-6 text-center text-xs text-ink-faint">
          Built on LPU&rsquo;s &ldquo;Designing Assignments and Assessment Rubrics in the AI Era&rdquo; guideline.
        </footer>
      </body>
    </html>
  );
}
