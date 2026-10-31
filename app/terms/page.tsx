import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the terms and usage conditions for BROBEX Image Tools and its online utilities.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="container">
      <div className="page-title">
        <span className="eyebrow">LEGAL INFORMATION</span>
        <h1>Terms of Service</h1>
        <p>
          Important information about using BROBEX Image Tools and its
          available features.
        </p>
      </div>

      <article className="page-content">
        <p><strong>Last updated:</strong> October 31, 2026</p>

        <h2>1. Acceptance of these terms</h2>
        <p>
          By accessing or using BROBEX Image Tools, you agree to use the
          website responsibly and in accordance with applicable laws.
          If you do not agree with these terms, discontinue using the website.
        </p>

        <h2>2. Permitted use</h2>
        <p>
          You may use the available tools for lawful personal, educational,
          or professional purposes. You are responsible for ensuring that
          you have the necessary rights and permissions for files and content
          that you submit or process.
        </p>

        <h2>3. Prohibited activities</h2>
        <p>
          You must not use the website to violate another person&apos;s rights,
          distribute unlawful content, interfere with website security,
          attempt unauthorized access, or disrupt the availability of the
          service.
        </p>

        <h2>4. Tool availability and accuracy</h2>
        <p>
          Features may vary by tool, browser, device, file format, and
          available system resources. Some listed tools may require
          integrations that are not yet configured. Their availability
          is identified on the relevant tool page.
        </p>
        <p>
          Always review generated files and results before relying on them.
          We do not guarantee that every file will be supported or that
          every result will meet a particular purpose.
        </p>

        <h2>5. Your files and content</h2>
        <p>
          You remain responsible for the content you select, upload, process,
          or download. You must have the legal right to use that content.
          Do not submit material that you are not authorized to process.
        </p>

        <h2>6. Third-party services</h2>
        <p>
          Certain features may depend on third-party software, libraries,
          hosting infrastructure, or external processing providers. Those
          services may have their own terms, availability limits, and
          privacy policies.
        </p>

        <h2>7. Intellectual property</h2>
        <p>
          Website branding, original design, and website materials belong
          to their respective owners unless otherwise stated. These terms
          do not transfer ownership of your original files or content.
        </p>

        <h2>8. Service changes</h2>
        <p>
          Features may be updated, changed, suspended, or discontinued as
          the website develops. We may also revise these terms when necessary.
          Updated terms will be published on this page.
        </p>

        <h2>9. Disclaimer</h2>
        <p>
          The website and its tools are provided on an available basis.
          To the extent permitted by applicable law, no guarantee is made
          that the service will always be uninterrupted, error-free, or
          suitable for a particular purpose.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions about these terms, use the contact options provided
          on the BROBEX Image Tools website.
        </p>
      </article>
    </div>
  );
}

