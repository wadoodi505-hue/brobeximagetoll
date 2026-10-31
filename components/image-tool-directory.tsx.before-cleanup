"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import {
  imageToolCategories,
  getDirectoryToolHref
} from "@/lib/image-tool-directory";

export function ImageToolDirectory() {
  const [query, setQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const search = query.trim().toLowerCase();

    return imageToolCategories
      .map((category) => ({
        ...category,
        tools: category.tools.filter((tool) =>
          tool.name.toLowerCase().includes(search)
        )
      }))
      .filter((category) => category.tools.length > 0);
  }, [query]);

  const totalResults = filteredCategories.reduce(
    (total, category) => total + category.tools.length,
    0
  );

  return (
    <section className="image-directory" aria-label="Image tool directory">
      <div className="directory-search">
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search all image tools..."
          aria-label="Search image tools"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")}>
            Clear
          </button>
        )}
      </div>

      <div className="directory-results">
        {totalResults} {totalResults === 1 ? "tool" : "tools"} found
      </div>

      {filteredCategories.length > 0 ? (
        <div className="directory-categories">
          {filteredCategories.map((category) => (
            <section className="directory-category" key={category.name}>
              <div className="directory-category-heading">
                <h3>{category.name}</h3>
                <span>{category.tools.length}</span>
              </div>

              <div className="directory-tool-list">
                {category.tools.map((tool, index) => {
                  const href = getDirectoryToolHref(tool);
                  const key = `${category.name}-${tool.name}-${index}`;

                  return href ? (
                    <Link
                      className="directory-tool"
                      href={href}
                      key={key}
                    >
                      <span>{tool.name}</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  ) : (
                    <span
                      className="directory-tool directory-tool-unavailable"
                      key={key}
                    >
                      {tool.name}
                    </span>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="directory-empty">
          No tools found. Try another search.
        </div>
      )}
    </section>
  );
}
