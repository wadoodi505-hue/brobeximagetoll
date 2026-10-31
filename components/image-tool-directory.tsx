"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
        tools: category.tools.filter(
          (tool) =>
            getDirectoryToolHref(tool) &&
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
          placeholder="Search image tools..."
          aria-label="Search image tools"
        />

        {query && (
          <button type="button" onClick={() => setQuery("")}>
            Clear
          </button>
        )}
      </div>

      {query.trim() && (
        <p className="directory-results" aria-live="polite">
          {totalResults} {totalResults === 1 ? "tool" : "tools"} found
        </p>
      )}

      {filteredCategories.length > 0 ? (
        <div className="directory-categories">
          {filteredCategories.map((category) => (
            <section className="directory-category" key={category.name}>
              <div className="directory-category-heading">
                <h2>{category.name}</h2>
              </div>

              <div className="directory-tool-list">
                {category.tools.map((tool, index) => {
                  const href = getDirectoryToolHref(tool);

                  if (!href) return null;

                  return (
                    <Link
                      className="directory-tool"
                      href={href}
                      key={`${category.name}-${tool.name}-${index}`}
                    >
                      <span>{tool.name}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="directory-empty">
          No matching tools found. Try another search.
        </div>
      )}
    </section>
  );
}
