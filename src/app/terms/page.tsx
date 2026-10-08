import type { Metadata } from "next";
import { Bullets, ContactLine, LegalPage, Section, operatorName } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms | LPU Assignment & Rubric Designer" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" version="Pilot version 0.1 · October 2026">
      <Section title="The pilot">
        <p>
          The LPU Assignment &amp; Rubric Designer is a free pilot run by {operatorName()}. It helps
          educators draft assignment briefs and grading rubrics. It may change, be interrupted or
          be withdrawn, and we do not promise it will always be available.
        </p>
      </Section>

      <Section title="Your account">
        <Bullets
          items={[
            "Use your own email address and keep your password private.",
            "You are responsible for what happens under your account.",
            "Tell us if you think someone else has used it.",
          ]}
        />
      </Section>

      <Section title="Using it responsibly">
        <Bullets
          items={[
            "Do not enter student names, marks or other personal or confidential information.",
            "Do not try to break, overload or misuse the service, or to avoid the daily limits.",
            "Do not use it for anything unlawful.",
            "Do not copy, resell or redistribute the app or its built-in templates.",
          ]}
        />
      </Section>

      <Section title="Drafts, not decisions">
        <p>
          The app uses artificial intelligence, which can make mistakes. Everything it produces is a
          first draft for you to check. You are responsible for reviewing it, adapting it to your
          course, and following your institution&rsquo;s approval process before giving it to
          students. The AI Stress Test is a guide to how easily an AI could do a task, not a
          guarantee.
        </p>
      </Section>

      <Section title="Your content">
        <p>
          You keep ownership of what you type and of the drafts created for you, to the extent the
          law allows. You allow us to store and process them, and to send them to our AI provider,
          only to run the service for you, as described in the Privacy Notice.
        </p>
      </Section>

      <Section title="No warranty and limits on responsibility">
        <p>
          The pilot is provided &ldquo;as is&rdquo;. To the extent the law allows, we are not
          responsible for losses that arise from using it, including from errors in AI-generated
          content or from the service being unavailable. Nothing here limits any right you have
          that cannot be limited by law.
        </p>
      </Section>

      <Section title="Ending">
        <p>
          You can stop at any time and delete your saved assignments on the Account page. We may
          suspend an account that breaks these terms. Fuller terms, including governing law, will be
          published before any paid launch.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions: <ContactLine />.
        </p>
      </Section>
    </LegalPage>
  );
}
