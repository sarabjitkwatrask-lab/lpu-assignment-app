import type { Metadata } from "next";
import { Bullets, ContactLine, LegalPage, Section, operatorName } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Notice | LPU Assignment & Rubric Designer" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Notice" version="Pilot version 0.1 · October 2026">
      <Section title="Who this notice is from">
        <p>
          This notice is from {operatorName()}, who run the LPU Assignment &amp; Rubric Designer
          pilot (&ldquo;we&rdquo;). It explains what we collect, why, who else handles it, and your
          choices. The app is for educators and is not meant for anyone under 18.
        </p>
      </Section>

      <Section title="What we collect">
        <Bullets
          items={[
            "Your email address and a password. The password is stored only in scrambled (hashed) form by our login provider.",
            "What you type into the form (course title and code, discipline, topic, Course Outcome, context anchor and similar).",
            "The assignments, rubrics and stress-test results the app creates for you, including the text the AI writes when it attempts your task.",
            "A usage record for each AI request: which kind, and when. It contains no content. We use it to apply daily fair-use limits.",
            "Technical information such as your IP address and browser type, kept by our hosting provider in routine logs.",
            "A sign-in cookie. It is strictly necessary to keep you logged in. We do not use advertising or tracking cookies.",
          ]}
        />
      </Section>

      <Section title="Why we use it">
        <Bullets
          items={[
            "To create your account and run the service for you.",
            "To keep your saved assignments so you can reopen, download or delete them.",
            "To prevent abuse and keep costs fair, using the daily limits.",
            "To understand how the pilot is used and improve it, using anonymised summary figures (for example, how many assignments were created).",
          ]}
        />
        <p>We do not sell your data and we do not use it for advertising.</p>
      </Section>

      <Section title="AI processing">
        <p>
          To write a draft, the app sends what you typed to an AI service (Claude, provided by
          Anthropic) and receives the result. Please do not enter student names, marks or
          confidential information. According to Anthropic&rsquo;s published commercial terms for its
          API, content sent this way is not used to train its models and is kept only for a limited
          period for operating and safety purposes.
        </p>
      </Section>

      <Section title="Who else handles your data, and where">
        <Bullets
          items={[
            "Supabase: login and database. Currently hosted in Singapore.",
            "Vercel: hosts the website and records routine access logs.",
            "Anthropic: the AI service that writes the drafts. Its servers are outside India.",
          ]}
        />
        <p>
          Because these providers are outside India, your data is transferred across borders when
          you use the app.
        </p>
      </Section>

      <Section title="Who can see your content">
        <p>
          Other users cannot see your assignments. The people who operate this pilot can access
          stored content for support and security, and to produce anonymised summary statistics.
          They will not publish your content, or identify you in any report, without your
          permission.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Your assignments are kept until you delete them or ask us to. Usage records are kept to
          apply the daily limits. When the pilot ends we will tell you, and either delete the data
          or ask your permission to keep it.
        </p>
      </Section>

      <Section title="Your choices">
        <Bullets
          items={[
            "Download everything the app stores about your assignments, or delete your saved assignments, on the Account page (signed-in users).",
            "To delete your login as well, to correct information, to withdraw your consent, or to raise a complaint, contact us.",
            "You can stop using the app at any time.",
          ]}
        />
        <p>
          Contact: <ContactLine />. We aim to respond within 7 days.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Data is sent over encrypted connections. Each account can read only its own assignments,
          and this is enforced inside the database. No system is perfectly secure, and we will tell
          affected users promptly if we find a breach that affects them.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If this notice changes in a way that matters, we will tell you before the change takes
          effect.
        </p>
      </Section>
    </LegalPage>
  );
}
