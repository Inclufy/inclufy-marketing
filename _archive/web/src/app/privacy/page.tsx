import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - InclufyGO',
  description: 'Privacy policy for InclufyGO, the AI-powered event marketing platform by Inclufy.',
};

const LAST_UPDATED = 'March 26, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-600 via-brand-700 to-purple-800 text-white py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-brand-100">InclufyGO &mdash; AI-Powered Event Marketing</p>
          <p className="mt-1 text-sm text-brand-200">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 text-gray-700 leading-relaxed">
        {/* Introduction */}
        <Section title="1. Introduction">
          <p>
            Inclufy BV (&quot;Inclufy&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the InclufyGO
            mobile application and the Inclufy Marketing web platform (collectively, the &quot;Services&quot;). This
            Privacy Policy explains what personal data we collect, how we use it, who we share it with, and your rights
            regarding your data.
          </p>
          <p className="mt-3">
            By using our Services, you agree to the collection and use of information in accordance with this policy. If
            you do not agree, please do not use our Services.
          </p>
        </Section>

        {/* Data We Collect */}
        <Section title="2. Data We Collect">
          <p>We collect the following categories of personal data:</p>

          <h4 className="font-semibold mt-4 text-gray-900">2.1 Account Information</h4>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Email address</li>
            <li>Name and profile information</li>
            <li>Organization name</li>
          </ul>

          <h4 className="font-semibold mt-4 text-gray-900">2.2 Content You Create</h4>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Photos and images captured during events</li>
            <li>Audio recordings (for transcription purposes)</li>
            <li>Text content, notes, and captions</li>
            <li>Event information (names, descriptions, locations, dates)</li>
            <li>Business card images (for contact recognition)</li>
          </ul>

          <h4 className="font-semibold mt-4 text-gray-900">2.3 Brand & Organization Data</h4>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Brand name, logo, and visual identity</li>
            <li>Tone of voice and communication style preferences</li>
            <li>Target audience and industry information</li>
            <li>Brand values and guidelines</li>
          </ul>

          <h4 className="font-semibold mt-4 text-gray-900">2.4 Social Media Account Data</h4>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Social media profile identifiers (LinkedIn, Facebook, Instagram)</li>
            <li>OAuth access tokens for publishing on your behalf</li>
            <li>Profile names and images from connected accounts</li>
          </ul>

          <h4 className="font-semibold mt-4 text-gray-900">2.5 Usage & Technical Data</h4>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Device type and operating system</li>
            <li>App usage patterns and feature interactions</li>
            <li>Language and locale preferences</li>
          </ul>
        </Section>

        {/* How We Collect Data */}
        <Section title="3. How We Collect Data">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Directly from you:</strong> When you create an account, capture photos or audio, enter text, scan
              business cards, or configure brand settings.
            </li>
            <li>
              <strong>Through connected services:</strong> When you link social media accounts via OAuth, we receive
              profile information and publishing permissions from those platforms.
            </li>
            <li>
              <strong>Automatically:</strong> Device and usage data collected during normal app operation.
            </li>
          </ul>
        </Section>

        {/* How We Use Data */}
        <Section title="4. How We Use Your Data">
          <p>We use your data for the following purposes:</p>

          <h4 className="font-semibold mt-4 text-gray-900">4.1 AI-Powered Content Generation</h4>
          <p className="mt-2">
            With your explicit consent, we send your content (photos, audio, text, event details, and brand guidelines)
            to third-party AI services to:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Generate social media post captions and hashtags</li>
            <li>Transcribe audio recordings to text</li>
            <li>Automatically tag and analyze photos</li>
            <li>Translate content into multiple languages</li>
            <li>Create event summaries and recaps</li>
            <li>Provide audience targeting suggestions</li>
            <li>Extract contact information from business cards</li>
          </ul>

          <h4 className="font-semibold mt-4 text-gray-900">4.2 Social Media Publishing</h4>
          <p className="mt-2">
            When you choose to publish content, we send your post text, images, and hashtags to the social media
            platforms you have connected (LinkedIn, Facebook, Instagram) using the access tokens you authorized.
          </p>

          <h4 className="font-semibold mt-4 text-gray-900">4.3 Service Operation</h4>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Providing and maintaining the Services</li>
            <li>Authenticating your identity</li>
            <li>Storing and organizing your content</li>
            <li>Applying your brand guidelines to generated content</li>
          </ul>
        </Section>

        {/* Third-Party AI Services */}
        <Section title="5. Third-Party AI Services">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-2">
            <p className="font-semibold text-amber-900">Important: AI Data Sharing</p>
            <p className="mt-2 text-amber-800">
              InclufyGO uses <strong>OpenAI</strong> as its AI provider. When you use AI-powered features, the
              following data may be sent to OpenAI&apos;s servers:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-amber-800">
              <li>Photos and images (processed by GPT-4o Vision)</li>
              <li>Audio recordings (processed by Whisper for transcription)</li>
              <li>Text content, notes, and event details (processed by GPT-4o / GPT-4o-mini)</li>
              <li>Brand guidelines and context</li>
              <li>Business card images (for OCR / contact extraction)</li>
            </ul>
          </div>

          <p className="mt-4">
            <strong>How OpenAI handles your data:</strong> OpenAI processes data sent through their API in accordance
            with their{' '}
            <a
              href="https://openai.com/policies/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline hover:text-brand-800"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="https://openai.com/policies/terms-of-use"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline hover:text-brand-800"
            >
              Terms of Use
            </a>
            . Data sent via the API is not used to train OpenAI&apos;s models.
          </p>

          <p className="mt-3">
            <strong>Consent:</strong> Before any data is sent to OpenAI, the app will ask for your explicit consent. You
            can grant or revoke this consent at any time through the app&apos;s Settings. If you decline consent, AI
            features will be unavailable, but all other app functionality remains accessible.
          </p>
        </Section>

        {/* Social Media Platforms */}
        <Section title="6. Social Media Platforms">
          <p>When you connect social media accounts, we share data with the following platforms:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>LinkedIn:</strong> Post text, images, and hashtags are sent to LinkedIn&apos;s API for publishing
              to your profile or company page.
            </li>
            <li>
              <strong>Meta (Facebook & Instagram):</strong> Post captions, images, and hashtags are sent to Meta&apos;s
              Graph API for publishing to your Facebook Page or Instagram Business account.
            </li>
          </ul>
          <p className="mt-3">
            Each platform processes your data according to their own privacy policies. We only share the content you
            explicitly choose to publish.
          </p>
        </Section>

        {/* Data Storage */}
        <Section title="7. Data Storage & Security">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Your data is stored securely using <strong>Supabase</strong> (hosted on AWS infrastructure in the EU).
            </li>
            <li>
              All data is transmitted over encrypted HTTPS connections.
            </li>
            <li>
              Access to your data is protected by Row Level Security (RLS) policies, ensuring only you and your
              organization members can access your content.
            </li>
            <li>
              OAuth tokens for social media accounts are stored securely and used solely for publishing on your behalf.
            </li>
          </ul>
        </Section>

        {/* Your Rights */}
        <Section title="8. Your Rights">
          <p>Under applicable data protection laws (including GDPR), you have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>Access</strong> your personal data and request a copy of the data we hold about you.
            </li>
            <li>
              <strong>Rectify</strong> inaccurate or incomplete personal data.
            </li>
            <li>
              <strong>Delete</strong> your personal data (&quot;right to be forgotten&quot;).
            </li>
            <li>
              <strong>Restrict</strong> or <strong>object</strong> to certain processing of your data.
            </li>
            <li>
              <strong>Withdraw consent</strong> for AI data processing at any time via the app&apos;s Settings screen,
              without affecting the lawfulness of processing based on consent before its withdrawal.
            </li>
            <li>
              <strong>Data portability:</strong> Request your data in a structured, commonly used format.
            </li>
            <li>
              <strong>Disconnect</strong> social media accounts at any time, which revokes our access to publish on
              those platforms.
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:privacy@inclufy.com" className="text-brand-600 underline hover:text-brand-800">
              privacy@inclufy.com
            </a>
            .
          </p>
        </Section>

        {/* Data Retention */}
        <Section title="9. Data Retention">
          <p>
            We retain your personal data for as long as your account is active or as needed to provide our Services. If
            you delete your account, we will delete your personal data within 30 days, except where retention is
            required by law.
          </p>
          <p className="mt-3">
            Content sent to OpenAI for processing is not retained by OpenAI after processing is complete (per their API
            data usage policy).
          </p>
        </Section>

        {/* Children */}
        <Section title="10. Children&apos;s Privacy">
          <p>
            Our Services are not directed to individuals under the age of 16. We do not knowingly collect personal data
            from children. If you become aware that a child has provided us with personal data, please contact us and we
            will take steps to delete such information.
          </p>
        </Section>

        {/* Changes */}
        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
            the new Privacy Policy in the app and updating the &quot;Last updated&quot; date. Your continued use of the
            Services after changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        {/* Contact */}
        <Section title="12. Contact Us">
          <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
          <div className="mt-3 bg-gray-50 rounded-lg p-4">
            <p className="font-semibold text-gray-900">Inclufy BV</p>
            <p>
              Email:{' '}
              <a href="mailto:privacy@inclufy.com" className="text-brand-600 underline hover:text-brand-800">
                privacy@inclufy.com
              </a>
            </p>
            <p>
              Website:{' '}
              <a
                href="https://inclufy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 underline hover:text-brand-800"
              >
                inclufy.com
              </a>
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Inclufy BV. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}
