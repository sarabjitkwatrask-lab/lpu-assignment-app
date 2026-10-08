import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { ContactLine } from "@/components/LegalPage";
import { deleteMyData } from "./actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");

  const { deleted, error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Your account</h1>
      <p className="mt-1 text-sm text-ink-soft">Signed in as {user.email}</p>

      {deleted !== undefined && (
        <p role="status" className="mt-6 rounded-lg bg-good-soft px-4 py-3 text-sm text-good">
          Done. {deleted} saved assignment{deleted === "1" ? "" : "s"} deleted.
        </p>
      )}
      {error === "confirm" && (
        <p role="alert" className="mt-6 rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad">
          Nothing was deleted. Type DELETE in capital letters to confirm.
        </p>
      )}

      <section className="mt-8 rounded-2xl border border-line bg-raised p-6">
        <h2 className="text-xl font-semibold">Download my data</h2>
        <p className="mt-2 text-sm text-ink-soft">
          A file with every assignment, rubric and stress-test result saved under your account,
          plus your usage record.
        </p>
        <a
          href="/api/account/export"
          className="mt-4 inline-block rounded-lg border border-line px-4 py-2.5 text-sm font-semibold hover:border-ink-faint"
        >
          Download my data (JSON file)
        </a>
      </section>

      <section className="mt-6 rounded-2xl border border-bad-line bg-raised p-6">
        <h2 className="text-xl font-semibold">Delete my saved assignments</h2>
        <p className="mt-2 text-sm text-ink-soft">
          This permanently deletes every assignment and stress-test result saved under your
          account. It cannot be undone. Download your data first if you may want it.
        </p>
        <form action={deleteMyData} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold">
              Type DELETE to confirm
            </label>
            <input
              id="confirm"
              name="confirm"
              autoComplete="off"
              required
              className="w-48 rounded-lg border border-line bg-raised px-3 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-bad px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Delete my assignments
          </button>
        </form>
      </section>

      <p className="mt-8 text-sm text-ink-soft">
        To delete your login as well, to correct information, or to withdraw your consent, contact{" "}
        <ContactLine />. See the{" "}
        <Link href="/privacy" className="font-semibold text-accent underline-offset-2 hover:underline">
          Privacy Notice
        </Link>
        .
      </p>
    </div>
  );
}
