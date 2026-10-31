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
  return (
    <section className="brobex-studio">
      <div className="brobex-studio-glow" aria-hidden="true" />

      <div className="brobex-studio-inner">
        <div className="brobex-studio-brand">
          <Link href="/" aria-label="BROBEX home">
            BROBEX<span>.</span>
          </Link>

          <p>BROWSER-BASED IMAGE STUDIO</p>
        </div>

        <div className="brobex-studio-heading">
          <span className="brobex-studio-category">
            {category.toUpperCase()} STUDIO
          </span>

          <h1>{title}<span>.</span></h1>

          <p>{description}</p>

          <div className="brobex-studio-status">
            <span className={status === "browser" ? "is-ready" : "is-limited"} />
            {status === "browser" ? "READY TO USE" : "INTEGRATION REQUIRED"}
          </div>
        </div>

        {children}

        <div className="brobex-studio-steps">
          <div><span>01</span><p>UPLOAD</p></div>
          <i />
          <div><span>02</span><p>PROCESS</p></div>
          <i />
          <div><span>03</span><p>EXPORT</p></div>
        </div>

        <footer className="brobex-studio-footer">
          BROBEX IMAGE STUDIO · PROFESSIONAL IMAGE EDITING
        </footer>
      </div>
    </section>
  );
}
