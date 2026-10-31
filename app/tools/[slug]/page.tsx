import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FontAwesomeToPngWorkspace } from "@/components/font-awesome-to-png-workspace";
import { ChartMakerWorkspace } from "@/components/chart-maker-workspace";
import { ImageSplitterWorkspace } from "@/components/image-splitter-workspace";
import { ColorizePhotoWorkspace } from "@/components/colorize-photo-workspace";
import { UpscaleWorkspace } from "@/components/upscale-workspace";
import { TiffToTextWorkspace } from "@/components/tiff-to-text-workspace";
import { ImageWorkspace } from "@/components/image-workspace";
import { PassportPhotoWorkspace } from "@/components/passport-photo-workspace";
import { RemoveObjectsWorkspace } from "@/components/remove-objects-workspace";
import { PhotoCleanupWorkspace } from "@/components/photo-cleanup-workspace";
import { PdfWorkspace } from "@/components/pdf-workspace";
import { WritingWorkspace } from "@/components/writing-workspace";
import { TranslateImageWorkspace } from "@/components/translate-image-workspace";
import { ImageToTextWorkspace } from "@/components/image-to-text-workspace";
import { ToolStudioBrand } from "@/components/tool-studio-brand";
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

  // Keep the existing category directory pages unchanged.
  if (category) {
    const listing = tools.filter(
      (tool) => tool.category === category.id
    );

    return (
      <div className="container category-page">
        <div className="page-title category-page-title">
          <div className="breadcrumb category-breadcrumb">
            <Link href="/">Home</Link> / {category.label} tools
          </div>

          <span className="eyebrow category-eyebrow">
            BROBEX TOOL DIRECTORY
          </span>

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

        <div className="page-content category-page-content">
          <ToolSearch
            tools={listing}
            placeholder={`Search ${category.label.toLowerCase()} tools...`}
          />
        </div>
      </div>
    );
  }

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

  // Preserve the existing real workspace for each supported tool.
  const workspace =
    tool.slug === "passport-photo-maker" ? (
      <PassportPhotoWorkspace />
    ) : tool.slug === "chart-maker" ? (
      <ChartMakerWorkspace />
    ) : tool.slug === "font-awesome-to-png" ? (
      <FontAwesomeToPngWorkspace />
    ) : tool.slug === "image-splitter" ? (
      <ImageSplitterWorkspace />
    ) : tool.slug === "tiff-to-text" ? (
      <TiffToTextWorkspace />
    ) : tool.slug === "image-to-text" ? (
      <ImageToTextWorkspace />
    ) : tool.slug === "translate-image" ? (
      <TranslateImageWorkspace />
    ) : tool.slug === "colorize-photo" ? (
      <ColorizePhotoWorkspace />
    ) : tool.slug === "photo-cleanup" ? (
      <PhotoCleanupWorkspace />
    ) : tool.slug === "remove-objects-from-photo" ? (
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
        <span className="integration-icon" aria-hidden="true">
          !
        </span>
        <div>
          <h3>Processing engine not configured</h3>
          <p>
            This tool requires a dedicated processing engine or external
            integration. It has not been marked as working because the
            current project does not include a tested implementation
            for this operation.
          </p>
          <p>
            This page will remain available for information, but the
            processing feature is not currently active.
          </p>
        </div>
      </div>
    );

  const isWritingTool = tool.category === "write";

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link href="/">Home</Link> /{" "}
        <Link href={cat.href}>{cat.label} tools</Link> / {tool.name}
      </div>

      <ToolStudioBrand
        title={tool.name}
        description={tool.description}
        category={cat.label}
        status={tool.status === "browser" ? "browser" : "integration"}
      >
        <div className="page-content">
          {workspace}

          <div className="privacy-line">
            {tool.status === "browser"
              ? "Processing takes place in your browser when supported by the selected tool. Check the individual tool's compatibility before using large files."
              : "This tool requires an additional processing integration. Its availability is clearly identified; no completed result is simulated."}
          </div>

          {tool.status === "browser" && (
            <>
              <h2>
                {isWritingTool
                  ? `How to use ${tool.name}`
                  : `How to use ${tool.name}`}
              </h2>

              {isWritingTool ? (
                <ol>
                  <li>Enter or paste text into the writing workspace.</li>
                  <li>Choose the available writing options.</li>
                  <li>Review the result and copy it when you are satisfied.</li>
                </ol>
              ) : (
                <ol>
                  <li>Select a supported file in the workspace.</li>
                  <li>Review the preview and adjust available settings.</li>
                  <li>Run the operation and review the result before downloading.</li>
                </ol>
              )}
            </>
          )}

          <h2>Compatibility and limitations</h2>

          <p>
            This tool uses the processing method listed as{" "}
            <strong>{tool.method}</strong>. Browser and device support
            can vary by file format and available memory. Unsupported
            formats and external providers are not silently substituted.
            Integration-required tools show their actual setup state
            instead of presenting a simulated result.
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
      </ToolStudioBrand>
    </div>
  );
}
