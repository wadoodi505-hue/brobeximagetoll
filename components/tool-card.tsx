import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ToolDefinition } from "@/types/tools";

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      className="directory-tool category-directory-tool"
      href={`/tools/${tool.slug}`}
      aria-label={`Open ${tool.name}`}
    >
      <span className="directory-tool-number" aria-hidden="true">
        {tool.category.toUpperCase().slice(0, 2)}
      </span>

      <span className="category-directory-copy">
        <span className="directory-tool-name">{tool.name}</span>
      </span>

      <span className="directory-tool-action" aria-hidden="true">
        <ArrowUpRight size={17} />
      </span>
    </Link>
  );
}
