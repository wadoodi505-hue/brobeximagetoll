export type ToolGuideData = {
  slug: string;
  title: string;
  keywords: string[];
  about: string;
  steps: string[];
  capabilities: string;
  benefits: string;
  limitations: string;
  faqs: { question: string; answer: string }[];
  quickGuide?: string[];
};

export function ToolGuide({ guide }: { guide: ToolGuideData }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <article className="tool-guide" aria-label={`${guide.title} guide`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <section className="tool-guide-section">
        <h2>About {guide.title}</h2><p>{guide.about}</p>
      </section>
      <section className="tool-guide-section">
        <h2>How to Use {guide.title}</h2>
        <ol>{guide.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
      </section>
      <section className="tool-guide-section">
        <h2>What Can You Do With {guide.title}?</h2><p>{guide.capabilities}</p>
      </section>
      <section className="tool-guide-section">
        <h2>Benefits &amp; Practical Uses</h2><p>{guide.benefits}</p>
      </section>
      <section className="tool-guide-section">
        <h2>Limitations &amp; Important Notes</h2><p>{guide.limitations}</p>
      </section>
      {guide.quickGuide && guide.quickGuide.length > 0 && (
      <section className="tool-guide-section">
        <h2>Quick Guide</h2>
        <ol>
          {guide.quickGuide.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ol>
      </section>
    )}
    <section className="tool-guide-section tool-guide-faq">
        <h2>Frequently Asked Questions</h2>
        {guide.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
      </section>
    </article>
  );
}

