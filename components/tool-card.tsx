import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ToolDefinition } from "@/types/tools";

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      className="directory-tool category-directory-tool"
      href={`/tools/${tool.slug}`}
    >
      <span className="directory-tool-number">
        {tool.category.toUpperCase().slice(0, 2)}
      </span>

      <span className="category-directory-copy">
        <span className="directory-tool-name">{tool.name}</span>
        <span className="category-directory-description">
          {tool.description}
        </span>
        <span className={`status ${tool.status}`}>
          {tool.status === "browser" ? "Ready to Use" : "Integration Required"}
        </span>
      </span>

      <span className="directory-tool-action">
        <ArrowUpRight size={17} />
      </span>
    </Link>
  );
}
