import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LPU Assignment & Rubric Designer",
  description:
    "Generate LPU-compliant assignment briefs and grading rubrics from the Designing Assignments and Assessment Rubrics in the AI Era guideline.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <Link href="/" className="font-semibold tracking-tight text-slate-900">
                LPU Assignment &amp; Rubric Designer
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Show when="signed-in">
                  <Link href="/generate" className="text-slate-600 hover:text-slate-900">
                    New assignment
                  </Link>
                  <Link href="/history" className="text-slate-600 hover:text-slate-900">
                    History
                  </Link>
                  <UserButton />
                </Show>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700">
                      Sign in
                    </button>
                  </SignInButton>
                </Show>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
            Built on LPU&apos;s &ldquo;Designing Assignments and Assessment Rubrics in the AI Era&rdquo; guideline.
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
