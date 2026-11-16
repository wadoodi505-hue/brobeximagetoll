import { AdvancedImageToolsWorkspace } from "@/components/advanced-image-tools-workspace";
import type { Metadata } from "next";
import { getToolMetadata } from "@/lib/tool-seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SignatureImageResizerWorkspace } from "@/components/signature-image-resizer-workspace";
import { DimensionResizerWorkspace } from "@/components/dimension-resizer-workspace";
import { BulkResizerWorkspace } from "@/components/bulk-resizer-workspace";
import { FontAwesomeToPngWorkspace } from "@/components/font-awesome-to-png-workspace";
import { ChartMakerWorkspace } from "@/components/chart-maker-workspace";
import { ImageSplitterWorkspace } from "@/components/image-splitter-workspace";
import { CollageMakerWorkspace } from "@/components/collage-maker-workspace";
import { OverlayImagesWorkspace } from "@/components/overlay-images-workspace";
import { SignatureGeneratorWorkspace } from "@/components/signature-generator-workspace";
import { ColorizePhotoWorkspace } from "@/components/colorize-photo-workspace";
import { UpscaleWorkspace } from "@/components/upscale-workspace";
import { TiffToTextWorkspace } from "@/components/tiff-to-text-workspace";
import { ImageWorkspace } from "@/components/image-workspace";
import { AddTextToImageWorkspace } from "@/components/add-text-to-image-workspace";
import { IncreaseImageFileSizeWorkspace } from "@/components/increase-image-file-size-workspace";
import { ImageCompressionWorkspace } from "@/components/image-compression-workspace";
import { FileSizeConverterWorkspace } from "@/components/file-size-converter-workspace";
import { getExactTargetTool } from "@/lib/exact-targets";
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
import { getToolGuide } from "@/content/tool-guides";
import { ToolGuide } from "@/components/tool-guide";
import { AdSenseUnit } from "@/components/adsense-unit";

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
      keywords: [`${category.label.toLowerCase()} tools`, `free ${category.label.toLowerCase()} tools online`, "BROBEX Image Tools"],
      alternates: { canonical: category.href },
      authors: [{ name: "BROBEX", url: "https://brobexportfolio.vercel.app/" }],
      openGraph: {
        title: `${category.label} Tools | BROBEX Image Tools`,
        description: category.description,
        url: `https://brobeximagetolls.vercel.app${category.href}`,
        images: [{ url: "/brobex-logo.webp", width: 1254, height: 1254, alt: "BROBEX Image Tools logo" }],
      },
    };
  }

  const tool = getTool(slug);

  if (!tool) {
    return {};
  }

  return getToolMetadata(tool);
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
    const categorySchema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${category.label} Tools | BROBEX Image Tools`,
      description: category.description,
      url: `https://brobeximagetolls.vercel.app${category.href}`,
      isPartOf: { "@type": "WebSite", name: "BROBEX Image Tools", url: "https://brobeximagetolls.vercel.app/" },
      author: { "@type": "Person", name: "BROBEX", url: "https://brobexportfolio.vercel.app/" },
    };
    const categoryBreadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://brobeximagetolls.vercel.app/" },
        { "@type": "ListItem", position: 2, name: `${category.label} Tools`, item: `https://brobeximagetolls.vercel.app${category.href}` },
      ],
    };

    return (
      <div className="container category-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([categorySchema, categoryBreadcrumbSchema]).replace(/</g, "\\u003c") }} />
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
            {category.description} Explore {listing.length} BROBEX {category.label.toLowerCase()} utilities, compare available features, and search by name, description, or format.
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

  const guide = getToolGuide(tool.slug);

  const cat = categories.find(
    (item) => item.id === tool.category
  );

  if (!cat) {
    notFound();
  }

  const relatedPriority: Record<string, string[]> = {
    "compress-image-size": ["resize-image-dimensions", "webp-to-jpg", "jpg-to-webp"],
    "resize-image-dimensions": ["bulk-image-resizer", "compress-image-size", "crop-image"],
    "bulk-image-resizer": ["resize-image-dimensions", "compress-image-size", "image-splitter"],
    "passport-photo-maker": ["signature-image-resizer", "resize-image-dimensions", "compress-image-size"],
    "image-to-text": ["tiff-to-text", "translate-image", "view-metadata"],
    "add-text-to-image": ["collage-maker", "overlay-images", "add-border-to-image"],
  };
  const preferredRelated = (relatedPriority[tool.slug] ?? [])
    .map((slug) => tools.find((item) => item.slug === slug))
    .filter((item): item is (typeof tools)[number] => Boolean(item));
  const related = (preferredRelated.length ? preferredRelated : tools.filter((item) => item.category === tool.category && item.slug !== tool.slug))
    .filter((item) => item.slug !== tool.slug)
    .slice(0, 3);

  // Preserve the existing real workspace for each supported tool.
  const exactTargetTool = getExactTargetTool(tool.slug);

  const advancedToolSlugs = new Set([
    "crop-round-corners", "image-color-picker", "edit-metadata", "remove-metadata", "view-metadata", "add-border-to-image",
    "blemishes-remover", "a4-size", "profile-photo-maker", "aspect-ratio-crop",
    "vsd-to-docx", "vsd-to-pptx", "vsd-to-jpg",
    "vsdx-to-docx", "vsdx-to-pptx", "vsdx-to-jpg",
  ]);

  const workspace =
    tool.slug === "add-text-to-image" ? (
      <AddTextToImageWorkspace />
    ) : advancedToolSlugs.has(tool.slug) ? (
      <AdvancedImageToolsWorkspace slug={tool.slug} title={tool.name} />
    ) :
    exactTargetTool ? (
      <ImageCompressionWorkspace
        targetKb={exactTargetTool.targetKb}
        minTargetKb={exactTargetTool.minTargetKb}
        lockedFormat={exactTargetTool.outputFormat}
        title={exactTargetTool.name}
        description={exactTargetTool.description}
      />
    ) : tool.slug === "compress-image-size" ? (
      <ImageCompressionWorkspace
        targetKb={null}
        title={tool.name}
        description={tool.description}
      />
    ) : tool.slug === "convert-mb-to-kb" ? (
      <FileSizeConverterWorkspace direction="mb-to-kb" title={tool.name} />
    ) : tool.slug === "convert-kb-to-mb" ? (
      <FileSizeConverterWorkspace direction="kb-to-mb" title={tool.name} />
    ) : tool.slug === "passport-photo-maker" ? (
      <PassportPhotoWorkspace />
    ) : tool.slug === "chart-maker" ? (
      <ChartMakerWorkspace />
    ) : tool.slug === "font-awesome-to-png" ? (
      <FontAwesomeToPngWorkspace />
    ) : tool.slug === "image-splitter" ? (
      <ImageSplitterWorkspace />
    ) : tool.slug === "combine-images" || tool.slug === "add-images-to-image" ? (
      <CollageMakerWorkspace />
    ) : tool.slug === "overlay-images" ? (
      <OverlayImagesWorkspace />
    ) : tool.slug === "collage-maker" ? (
      <CollageMakerWorkspace />
    ) : tool.slug === "signature-generator" ? (
      <SignatureGeneratorWorkspace />
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
    ) : (tool.slug === "remove-objects-from-photo" || tool.slug === "blur-any-object") ? (
      <RemoveObjectsWorkspace />
    ) : tool.slug === "upscale-image" ? (
      <UpscaleWorkspace />
    ) : tool.category === "pdf" ? (
      <PdfWorkspace tool={tool} />
    ) : tool.slug === "increase-image-file-size" ? (
      <IncreaseImageFileSizeWorkspace />
    ) : tool.slug === "signature-image-resizer" ? (
      <SignatureImageResizerWorkspace />
    ) : tool.slug === "resize-image-dimensions" ? (
      <DimensionResizerWorkspace />
    ) : tool.slug === "bulk-image-resizer" ? (
      <BulkResizerWorkspace />
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
  const toolUrl = `https://brobeximagetolls.vercel.app/tools/${encodeURIComponent(tool.slug)}`;
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `BROBEX ${tool.name}`,
    description: tool.description,
    applicationCategory:
      tool.category === "image"
        ? "MultimediaApplication"
        : tool.category === "pdf"
          ? "UtilitiesApplication"
          : "BusinessApplication",
    operatingSystem: "Any operating system with a supported modern web browser",
    browser: "Requires JavaScript and the browser APIs listed for this tool",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: toolUrl,
    author: {
      "@type": "Person",
      name: "BROBEX",
      url: "https://brobexportfolio.vercel.app/",
      email: "brobex.ffx@gmail.com",
    },
    publisher: {
      "@type": "Organization",
      name: "BROBEX",
      url: "https://brobexportfolio.vercel.app/",
    },
  };
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${tool.name} | BROBEX Image Tools`,
    description: tool.description,
    url: toolUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "BROBEX Image Tools",
      url: "https://brobeximagetolls.vercel.app/",
    },
    publisher: {
      "@type": "Organization",
      name: "BROBEX",
      url: "https://brobexportfolio.vercel.app/",
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://brobeximagetolls.vercel.app/" },
      { "@type": "ListItem", position: 2, name: `${cat.label} Tools`, item: `https://brobeximagetolls.vercel.app${cat.href}` },
      { "@type": "ListItem", position: 3, name: tool.name, item: toolUrl },
    ],
  };
  const howToSchema = guide?.steps?.length
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `How to use ${tool.name}`,
        description: guide.about,
        step: guide.steps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: `Step ${index + 1}`,
          text: step,
        })),
      }
    : null;

  return (
    <div className="container tool-page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([webPageSchema, ...(tool.status === "browser" ? [softwareSchema] : []), breadcrumbSchema, ...(howToSchema && tool.status === "browser" ? [howToSchema] : [])]).replace(/</g, "\\u003c"),
        }}
      />
      <nav className="breadcrumb tool-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={cat.href}>{cat.label}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{tool.name}</span>
      </nav>

      <ToolStudioBrand
        title={tool.name}
        description={tool.description}
        category={cat.label}
        status={tool.status === "browser" ? "browser" : "integration"}
      >
        <div className="page-content tool-detail-content">
          <div className="tool-workspace-shell" key={tool.slug}>
            {workspace}
          </div>

          <AdSenseUnit />

          <div className="privacy-line">
            <span className="privacy-line-mark" aria-hidden="true" />
            {tool.status === "browser"
              ? "Processing takes place in your browser when supported by the selected tool. Your original file stays under your control."
              : "This tool requires an additional processing integration. Its availability is clearly identified; no completed result is simulated."}
          </div>

          {guide && <ToolGuide guide={guide} />}

          <div className="tool-info-grid">
            {tool.status === "browser" && (
              <section className="tool-info-card">
                <span className="tool-info-eyebrow">01 / QUICK GUIDE</span>
                <h2>How to use {tool.name}</h2>
                {isWritingTool ? (
                  <ol>
                    <li>Enter or paste text into the writing workspace.</li>
                    <li>Choose the available writing options.</li>
                    <li>Review the result and copy it when you are satisfied.</li>
                  </ol>
                ) : (
                  <ol>
                    <li>Select a supported file in the workspace.</li>
                    <li>Review the preview and adjust the available settings.</li>
                    <li>Run the operation, check the result, and download your file.</li>
                  </ol>
                )}
              </section>
            )}

            <section className="tool-info-card">
              <span className="tool-info-eyebrow">
                {tool.status === "browser" ? "02 / TECHNICAL DETAILS" : "01 / TECHNICAL DETAILS"}
              </span>
              <h2>Compatibility and limitations</h2>
              <p>
                This tool uses <strong>{tool.method}</strong>. Browser and device
                support can vary by file format and available memory. Unsupported
                formats and external providers are not silently substituted.
                Integration-required tools show their actual setup state instead
                of presenting a simulated result.
              </p>
            </section>
          </div>

          {related.length > 0 && (
            <section className="tool-related-section">
              <div className="tool-related-heading">
                <div>
                  <span className="tool-info-eyebrow">KEEP CREATING</span>
                  <h2>Related tools</h2>
                </div>
                <Link href={cat.href}>Explore {cat.label.toLowerCase()} tools â†—</Link>
              </div>
              <div className="tool-grid">
                {related.map((item) => (
                  <ToolCard key={item.slug} tool={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </ToolStudioBrand>
    </div>
  );
}



