
import { UpscaleWorkspace } from "@/components/upscale-workspace";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageWorkspace } from "@/components/image-workspace";
import { RemoveObjectsWorkspace } from "@/components/remove-objects-workspace";
import { PdfWorkspace } from "@/components/pdf-workspace";
import { WritingWorkspace } from "@/components/writing-workspace";
import { ToolCard } from "@/components/tool-card";
import { ToolSearch } from "@/components/tool-search";
import { getTool, tools, categories } from "@/lib/tools";

export function generateStaticParams() {
  const toolParams = tools
    .filter(
      (tool) =>
        typeof tool.slug === "string" &&
        tool.slug.trim().length > 0
    )
    .map((tool) => ({
      slug: tool.slug,
    }));

  const categoryParams = categories.map((category) => ({
    slug: category.id === "file" ? "file_conversion" : category.id,
  }));

  return [...toolParams, ...categoryParams];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoryId = slug === "file_conversion" ? "file" : slug;

  const category = categories.find(
    (item) => item.id === categoryId
  );

  if (category) {
    return {
      title: `${category.label} Tools`,
      description: category.description,
      alternates: {
        canonical: category.href,
      },
      openGraph: {
        title: `${category.label} Tools | BROBEX`,
        description: category.description,
      },
    };
  }

  const tool = getTool(slug);

  if (!tool) {
    return {};
  }

  return {
    title: tool.name,
    description: tool.description,
    alternates: {
      canonical: `/tools/${tool.slug}`,
    },
    openGraph: {
      title: `${tool.name} | BROBEX Image Tools`,
      description: tool.description,
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const categoryId = slug === "file_conversion" ? "file" : slug;
  const category = categories.find(
    (item) => item.id === categoryId
  );

  // Category directory page
  if (category) {
    const listing = tools.filter(
      (tool) => tool.category === category.id
    );

    return (
      <div className="container">
        <div className="page-title">
          <div className="breadcrumb">
            <Link href="/">Home</Link> / {category.label} tools
          </div>

          <span className="eyebrow">BROBEX TOOL DIRECTORY</span>

          <h1>
            {category.id === "image"
              ? "Image Tools"
              : `${category.label} Tools`}
          </h1>

          <p>
            {category.description} Browse {listing.length} tools and
            search by name, description, or format.
          </p>
        </div>

        <div className="page-content">
          <ToolSearch
            tools={listing}
            placeholder={`Search ${category.label.toLowerCase()} tools...`}
          />
        </div>
      </div>
    );
  }

  // Individual tool page
  const tool = getTool(slug);

  if (!tool) {
    notFound();
  }

  const cat = categories.find(
    (item) => item.id === tool.category
  );

  if (!cat) {
    notFound();
  }

  const related = tools
    .filter(
      (item) =>
        item.category === tool.category &&
        item.slug !== tool.slug
    )
    .slice(0, 3);

  return (
    <div className="container">
      <div className="page-title">
        <div className="breadcrumb">
          <Link href="/">Home</Link> /{" "}
          <Link href={cat.href}>{cat.label} tools</Link> / {tool.name}
        </div>

        <div className="tool-detail-title">
          <span className="tool-icon">âœ³</span>

          <div>
            <h1>{tool.name}</h1>
            <p>{tool.description}</p>

            <span className={`status ${tool.status}`}>
              {tool.status === "browser"
                ? "Ready to Use"
                : "Integration Required"}
            </span>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Select the correct workspace for this tool */}
        {tool.slug === "remove-objects-from-photo" ? (
          <RemoveObjectsWorkspace />
        ) : tool.slug === "upscale-image" ? (
          <UpscaleWorkspace />
        ) : tool.category === "pdf" ? (
          <PdfWorkspace tool={tool} />
        ) : tool.category === "image" ? (
          <ImageWorkspace tool={tool} />
        ) : tool.category === "write" ? (
          <WritingWorkspace tool={tool} />
        ) : (
          <div className="integration-notice">
            <span className="integration-icon">âœ³</span>
            <div>
              <h3>Processing engine not configured</h3>
              <p>
                This conversion requires a dedicated media or document
                engine. It has not been marked as working because the
                current project does not include a safe, tested
                implementation for this format.
              </p>
            </div>
          </div>
        )}

        <div className="privacy-line">
          {tool.status === "browser"
            ? "Browser-based tools process your selected files locally when supported. Advanced tools clearly identify external requirements."
            : "This tool requires an additional integration. Review its setup requirements before using it."}
        </div>

        <h2>How to use {tool.name}</h2>

        <ol>
          <li>Select a file in a supported format.</li>
          <li>Review the preview and adjust available settings.</li>
          <li>
            Run the operation and review the result before downloading.
          </li>
        </ol>

        <h2>Compatibility and limitations</h2>

        <p>
          This tool uses the processing method listed as{" "}
          <strong>{tool.method}</strong>. Browser support varies by file
          format and device. Unsupported codecs and external providers
          are not silently substituted; an integration-required tool
          will show its setup state instead of a false result.
        </p>

        {related.length > 0 && (
          <>
            <div className="divider" />

            <h2>Related tools</h2>

            <div className="tool-grid">
              {related.map((item) => (
                <ToolCard key={item.slug} tool={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

