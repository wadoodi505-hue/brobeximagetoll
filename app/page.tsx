import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Download,
  Image as ImageIcon,
  FileText,
  PenLine,
  FileVideo,
  FileCog,
  ArrowUpRight
} from "lucide-react";
import { categories } from "@/lib/tools";
import { ImageToolDirectory } from "@/components/image-tool-directory";

const categoryIcons: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  pdf: FileText,
  write: PenLine,
  video: FileVideo,
  file: FileCog
};

export default function HomePage() {
  return (
    <>
      <section className="container hero">
        <span className="eyebrow">A BETTER WAY TO GET IT DONE</span>
        <h1>Image Tools</h1>
        <p className="hero-subtitle">BROBEX free image tools website</p>
        <p className="hero-description">
          Edit, resize, compress, convert, and enhance images with a focused
          collection of practical tools. Start in your browser wherever supported.
        </p>

        <div className="feature-pills">
          <span><ShieldCheck size={14} /> Browser-based processing</span>
          <span><Zap size={14} /> Lightweight by design</span>
          <span><Download size={14} /> Easy downloads</span>
        </div>
      </section>

      <section className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EXPLORE THE TOOLBOX</span>
            <h2>One place for everyday work.</h2>
            <p>Choose a category to find the tool you need.</p>
          </div>
        </div>

        <div className="category-strip">
          {categories.map((category) => {
            const Icon = categoryIcons[category.id] ?? ImageIcon;

            return (
              <Link
                className="category-tile"
                key={category.id}
                href={category.href}
              >
                <span className="tile-icon">
                  <Icon size={19} />
                </span>
                <strong>
                  {category.label} tools{" "}
                  <ArrowUpRight
                    size={14}
                    style={{ display: "inline", verticalAlign: "middle" }}
                  />
                </strong>
                <p>{category.description}</p>
              </Link>
            );
          })}
        </div>

        <div className="section-heading directory-main-heading">
          <div>
            <span className="eyebrow">IMAGE TOOL DIRECTORY</span>
            <h2>Find the right tool.</h2>
            <p>Explore all tools by category or search by name.</p>
          </div>
        </div>

        <ImageToolDirectory />
      </section>
    </>
  );
}

