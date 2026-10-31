import { ImageToolDirectory } from "@/components/image-tool-directory";

export default function HomePage() {
  return (
    <>
      <section className="container hero">
        <h1>BROBEX IMAGE TOOLS</h1>
        <p className="hero-subtitle">Free online image tools</p>
      </section>

      <section className="container section">
        <ImageToolDirectory />
      </section>
    </>
  );
}


