"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { imageToolCategories, getDirectoryToolState } from "@/lib/image-tool-directory";

export function ImageToolDirectory() {
  const [query, setQuery] = useState("");
  const filteredCategories = useMemo(() => {
    const search = query.trim().toLowerCase();
    return imageToolCategories.map((category) => ({
      ...category,
      tools: category.tools.filter((tool) =>
        `${tool.name} ${tool.description ?? ""} ${tool.slug ?? ""} ${category.name}`.toLowerCase().includes(search)
      )
    })).filter((category) => category.tools.length > 0);
  }, [query]);

  const totalResults = filteredCategories.reduce((total, category) => total + category.tools.length, 0);

  return (
    <section className="image-directory" aria-label="Image tool directory">
      <label className="directory-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Tool"
          aria-label="Search all image tools"
        />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">Clear</button>}
      </label>

      {query.trim() && <p className="directory-results" aria-live="polite">{totalResults} {totalResults === 1 ? "tool" : "tools"} found</p>}

      {filteredCategories.length ? (
        <div className="directory-categories">
          {filteredCategories.map((category) => (
            <section className="directory-category" key={category.name}>
              <div className="directory-category-heading">
                <h2>{category.name}</h2>
                <span className="directory-category-count">{category.tools.length} TOOLS</span>
              </div>
              <div className="directory-tool-list">
                {category.tools.map((tool, index) => {
                  const state = getDirectoryToolState(tool);
                  const content = (
                    <>
                      <span className="directory-tool-name"><strong>{tool.name}</strong></span>

                    </>
                  );
                  return state.href ? (
                    <Link className="directory-tool" href={state.href} key={`${tool.slug}-${index}`}>{content}</Link>
                  ) : null;
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="directory-empty"><Search size={25} /><p>No matching tools found.</p><span>Try another search term or clear your search.</span></div>
      )}
    </section>
  );
}

const quickLinks = [
  { label: "Compress Image", slug: "compress-image-size" },
  { label: "PDF to Images", slug: "pdf-to-jpg" },
  { label: "Remove Background", slug: "remove-background-from-image" },
  { label: "Image to PDF", slug: "jpg-to-pdf" },
  { label: "Passport Photo", slug: "passport-photo-maker" },
  { label: "Blur Background", slug: "blur-background" },
  { label: "Resize Image", slug: "resize-image-dimensions" },
  { label: "Bulk Image Resizer", slug: "bulk-image-resizer" },
  { label: "Image to Text", slug: "image-to-text" }
];

export function DirectorySidebar() {
  return (
    <aside className="directory-sidebar" aria-label="Quick access and advertisements">
      <section className="sidebar-quick-access">
        <h2>Quick Access Tools</h2>
        <div className="sidebar-quick-grid">
          {quickLinks.map((link) => (
            <Link href={`/tools/${link.slug}`} key={link.slug}>{link.label}</Link>
          ))}
        </div>
      </section>
      <section className="sidebar-advertisement" aria-label="Advertisement space">
        <span>ADVERTISEMENT</span>
        <div className="sidebar-ad-placeholder">Advertisement space</div>
      </section>
      <section className="sidebar-note">
        <strong>More tools, one workspace.</strong>
        <p>Browse the complete BROBEX collection. Tools that need an external provider are still listed and clearly identified.</p>
        <a href="#all-tools"><ArrowUpRight size={14} /></a>
      </section>
    </aside>
  );
}
