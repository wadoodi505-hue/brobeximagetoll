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

  const workflow =
    normalizedCategory.includes("write")
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
      <div className="brobex-studio-glow" aria-hidden="true" />

      <div className="brobex-studio-inner">
        <div className="brobex-studio-brand">
          <Link href="/" aria-label="BROBEX home">
            BROBEX<span>.</span>
          </Link>
          <p>DIGITAL TOOL STUDIO</p>
        </div>

        <div className="brobex-studio-heading">
          <span className="brobex-studio-category">
            {category.toUpperCase()} STUDIO
          </span>

          <h1>
            {title}<span>.</span>
          </h1>

          <p>{description}</p>

          <div className="brobex-studio-status">
            <span
              className={
                status === "browser" ? "is-ready" : "is-limited"
              }
            />
            {status === "browser"
              ? "READY TO USE"
              : "INTEGRATION REQUIRED"}
          </div>
        </div>

        {children}

        {status === "browser" && (
          <div
            className="brobex-studio-steps"
            aria-label="Typical tool workflow"
          >
            {workflow.map(([number, label], index) => (
              <div className="brobex-studio-step-group" key={number}>
                <div>
                  <span>{number}</span>
                  <p>{label}</p>
                </div>
                {index < workflow.length - 1 && <i aria-hidden="true" />}
              </div>
            ))}
          </div>
        )}

        <footer className="brobex-studio-footer">
          BROBEX DIGITAL STUDIO · PRACTICAL TOOLS, THOUGHTFULLY BUILT
        </footer>
      </div>
    </section>
  );
}
