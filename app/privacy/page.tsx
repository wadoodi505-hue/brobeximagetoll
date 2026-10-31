import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how BROBEX Image Tools handles uploaded files, browser processing, analytics, and third-party services.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="container">
      <div className="page-title">
        <span className="eyebrow">LEGAL & PRIVACY</span>
        <h1>Privacy Policy</h1>
        <p>
          How BROBEX Image Tools handles information when you use our website
          and online utilities.
        </p>
      </div>

      <article className="page-content">
        <p><strong>Last updated:</strong> October 31, 2026</p>

        <h2>1. Introduction</h2>
        <p>
          BROBEX Image Tools provides online utilities for working with images,
          documents, and other supported content. This policy explains the
          types of information that may be processed when you visit or use
          the website.
        </p>

        <h2>2. Files and browser processing</h2>
        <p>
          Tools identified as browser-based are designed to process supported
          files using your browser and your device. The processing method
          depends on the individual tool, browser capabilities, and selected
          operation.
        </p>
        <p>
          Do not assume that every tool uses local processing. Some features
          may require an external processing service or a separate integration.
          Where a feature sends content to another service, that service may
          process the information needed to provide the feature.
        </p>
        <p>
          Only select files that you have permission to use. Avoid submitting
          confidential, sensitive, or private information unless you have
          checked how the particular feature processes it.
        </p>

        <h2>3. Analytics and website operation</h2>
        <p>
          This website uses Vercel Analytics. Analytics may process website
          usage and performance information to help us understand how the
          website is used and improve its operation. The information handled
          depends on the analytics configuration and the provider&apos;s current
          practices.
        </p>
        <p>
          The website is hosted using Vercel infrastructure. The hosting
          provider may process technical request information as necessary
          to deliver, secure, and maintain the website.
        </p>

        <h2>4. Browser storage</h2>
        <p>
          The website may use browser local storage to remember your display
          theme preference. This preference is stored on your device and can
          be cleared through your browser settings.
        </p>

        <h2>5. Third-party services</h2>
        <p>
          Some tools may depend on third-party libraries, providers, or
          integrations. When an external service is used, its own privacy
          practices and terms may also apply. Review the relevant provider&apos;s
          documentation before submitting content to such a feature.
        </p>
        <p>
          Tools that are marked as requiring an integration are not represented
          as fully operational until their required processing service has
          been configured and tested.
        </p>

        <h2>6. Data retention and security</h2>
        <p>
          The handling and retention of information depend on the tool,
          browser, hosting infrastructure, and any external provider involved.
          Browser-based processing may use temporary browser memory or
          resources. Files you download are managed by your device and browser.
        </p>
        <p>
          No online service can guarantee absolute security. You should keep
          your own copies of important files and avoid submitting information
          that you do not want processed.
        </p>

        <h2>7. Children and privacy</h2>
        <p>
          The website is not designed to request personal information from
          children. If you believe personal information has been submitted
          inappropriately, please contact the website operator through the
          available contact page.
        </p>

        <h2>8. Changes to this policy</h2>
        <p>
          This policy may be updated when website features, analytics,
          advertising, or external services change. The latest version will
          be published on this page with an updated revision date.
        </p>

        <h2>9. Contact</h2>
        <p>
          For privacy-related questions, use the contact options provided
          on the BROBEX Image Tools website.
        </p>
      </article>
    </div>
  );
}

