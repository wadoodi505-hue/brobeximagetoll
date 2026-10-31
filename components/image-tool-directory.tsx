"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ArrowUpRight, Clock3 } from "lucide-react";
import {
  imageToolCategories,
  getDirectoryToolState
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
          placeholder="Search tools..."
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
          {filteredCategories.map((category, categoryIndex) => (
            <section
              className="directory-category"
              key={category.name}
            >
              <div className="directory-category-heading">
                <span className="directory-category-index">
                  {String(categoryIndex + 1).padStart(2, "0")}
                </span>

                <h2>{category.name}</h2>

                <span className="directory-category-count">
                  {String(category.tools.length).padStart(2, "0")} TOOLS
                </span>
              </div>

              <div className="directory-tool-list">
                {category.tools.map((tool, index) => {
                  const state = getDirectoryToolState(tool);

                  const content = (
                    <>
                      <span className="directory-tool-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="directory-tool-name">
                        {tool.name}
                      </span>

                      {state.available ? (
                        <span className="directory-tool-action">
                          <ArrowUpRight size={17} />
                        </span>
                      ) : (
                        <span className="directory-tool-status">
                          <Clock3 size={12} />
                          Coming Soon
                        </span>
                      )}
                    </>
                  );

                  return state.available && state.href ? (
                    <Link
                      className="directory-tool"
                      href={state.href}
                      key={`${category.name}-${tool.name}-${index}`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      className="directory-tool directory-tool--unavailable"
                      key={`${category.name}-${tool.name}-${index}`}
                      aria-label={`${tool.name}, coming soon`}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="directory-empty">
          <Search size={25} />
          <p>No matching tools found.</p>
          <span>Try another search term.</span>
        </div>
      )}
    </section>
  );
}

