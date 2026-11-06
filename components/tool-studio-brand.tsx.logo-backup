import Link from "next/link";
import type { ReactNode } from "react";

type ToolStudioBrandProps = {
  title: string;
  description: string;
  category: string;
  status?: "browser" | "integration";
  children?: ReactNode;
};

export function ToolStudioBrand({
  title,
  description,
  category,
  status = "browser",
  children,
}: ToolStudioBrandProps) {
  const normalizedCategory = category.toLowerCase();

  const workflow = normalizedCategory.includes("write")
    ? [
        ["01", "INPUT"],
        ["02", "REFINE"],
        ["03", "COPY"],
      ]
    : [
        ["01", "SELECT"],
        ["02", "PROCESS"],
        ["03", "EXPORT"],
      ];

  return (
    <section className="brobex-studio">
      <div className="brobex-studio-inner">
        <div className="brobex-studio-topline">
          <Link href="/" className="brobex-studio-brand" aria-label="BROBEX home">
            <span className="brobex-studio-brand-mark">B</span>
            <span className="brobex-studio-brand-name">
              BROBEX<span>TOOLS</span>
            </span>
          </Link>
          <span className="brobex-studio-product-label">DIGITAL TOOL STUDIO</span>
          <span className="brobex-studio-privacy-label">
            <i aria-hidden="true" />
            PRIVATE WORKSPACE
          </span>
        </div>

        <header className="brobex-studio-heading">
          <div className="brobex-studio-category">
            <span>{category.toUpperCase()} STUDIO</span>
            <span className="brobex-studio-category-divider">/</span>
            <span>WORKSPACE</span>
          </div>

          <h1>{title}<span>.</span></h1>
          <p>{description}</p>

        </header>

        <div className="brobex-studio-content">{children}</div>

        {status === "browser" && (
          <div className="brobex-studio-steps" aria-label="Typical tool workflow">
            {workflow.map(([number, label], index) => (
              <div className="brobex-studio-step-group" key={number}>
                <div className="brobex-studio-step">
                  <span>{number}</span>
                  <p>{label}</p>
                </div>
                {index < workflow.length - 1 && <i aria-hidden="true" />}
              </div>
            ))}
          </div>
        )}

        <footer className="brobex-studio-footer">
          <span>BROBEX DIGITAL STUDIO</span>
          <span>Practical tools, thoughtfully built.</span>
        </footer>
      </div>
    </section>
  );
}
