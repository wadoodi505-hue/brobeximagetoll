import type { Metadata } from "next";
import type { ToolDefinition } from "@/types/tools";

const SITE = "https://brobeximagetolls.vercel.app";
const BRAND = "Brobex";

type SeoCopy = { title: string; description: string; keywords: string[]; ogTitle?: string };

const seoBySlug: Record<string, SeoCopy> = {
  "collage-maker": {
    title: "Free Online Photo Collage Maker: Create Photo Grids | Brobex",
    description: "Create photo collages online with grid and featured layouts. Arrange up to 20 photos, customize spacing, margins, corners and backgrounds, then export high-resolution PNG, JPG or WebP images.",
    keywords: ["photo collage maker", "create photo collage online", "picture collage maker", "photo grid maker", "combine photos into one image"],
    ogTitle: "Create Beautiful Photo Collages Online – BROBEX",
  },
  "compress-image-size": {
    title: "Free Online Image Compressor: Reduce Image File Size | Brobex",
    description: "Reduce image file size while balancing visual quality. Compress JPG, PNG, WebP, and other supported image formats with this free online image compressor.",
    keywords: ["compress image size", "reduce image file size", "online image compressor", "optimize image"],
    ogTitle: "Fast & Free Online Image Compressor – Brobex Tools",
  },
  "compress-jpeg-between-20kb-to-50kb": {
    title: "Compress JPEG Between 20KB to 50KB Online | Brobex",
    description: "Compress JPEG images toward a 20KB–50KB file-size range for application forms, portals, and uploads with strict file limits.",
    keywords: ["compress jpeg between 20kb 50kb", "shrink jpeg file size", "JPEG compressor"],
  },
  "remove-background-from-image": {
    title: "AI Background Remover: Remove Image Background Free | Brobex",
    description: "Remove image backgrounds and create transparent PNGs with the available background-removal processing. Preview the result before downloading.",
    keywords: ["remove background from image", "transparent background maker", "AI background remover"],
  },
  "make-background-transparent": {
    title: "Make Image Background Transparent Online Free | Brobex",
    description: "Create transparent image backgrounds with BROBEX. Prepare PNG images for product listings, designs, presentations, and creative projects.",
    keywords: ["make background transparent", "transparent image maker", "transparent PNG"],
  },
  "blur-background": {
    title: "Blur Image Background Online | Free Photo Background Blur | Brobex",
    description: "Apply a controllable blur effect to photo backgrounds online. Preview your edited image and export the result from your browser.",
    keywords: ["blur image background online", "photo background blur", "bokeh effect tool"],
  },
  "blur-any-object": {
    title: "Blur Faces, Text & Objects in Images Online | Brobex",
    description: "Select areas of an image and apply a blur effect to faces, text, or other details before exporting your edited photo.",
    keywords: ["blur faces in photos", "blur text in image", "blur objects online"],
  },
  "upscale-image": {
    title: "Image Upscaler: Enlarge & Enhance Photos Online | Brobex",
    description: "Enlarge images with browser-based resampling. Choose an available scale, preview the dimensions, and download the resized image.",
    keywords: ["image upscaler", "enlarge image online", "increase image resolution"],
  },
  "view-metadata": {
    title: "EXIF Image Metadata Viewer: View Photo Details Online | Brobex",
    description: "Inspect available image metadata, including EXIF details and camera information, directly in your browser without sending the image to a server.",
    keywords: ["view image metadata", "EXIF viewer online", "check photo metadata"],
  },
  "font-awesome-to-png": {
    title: "Convert Font Awesome Icons to PNG Online | Brobex",
    description: "Export Font Awesome icons as PNG images with adjustable dimensions and transparent backgrounds using the BROBEX online converter.",
    keywords: ["font awesome to png converter", "export icon as png", "icon PNG maker"],
  },
  "compress-pdf": {
    title: "Free Online PDF Compressor: Reduce PDF File Size | Brobex",
    description: "Reduce PDF file size for sharing, email, and online uploads. Review the processed document before downloading.",
    keywords: ["compress PDF online", "reduce PDF file size", "free PDF compressor"],
  },
  "merge-pdf": {
    title: "Merge PDF Files Online Free | Combine PDF Documents | Brobex",
    description: "Combine multiple PDF documents into one file with the BROBEX online PDF merger. Arrange your files and review the merged document.",
    keywords: ["merge PDF online", "combine PDF files", "join PDF documents"],
  },
  "split-pdf": {
    title: "Split PDF Pages Online Free | Extract PDF Pages | Brobex",
    description: "Split a PDF into separate documents or extract selected pages with the BROBEX online PDF splitter.",
    keywords: ["split PDF pages", "extract PDF pages", "PDF splitter online"],
  },
  "edit-pdf": {
    title: "Online PDF Editor: Edit & Annotate PDF Files | Brobex",
    description: "Make supported edits to PDF documents online. Use the available workspace tools to modify and review your PDF.",
    keywords: ["online PDF editor", "edit PDF online", "PDF annotation tool"],
  },
  "essay-writer": {
    title: "AI Essay Writer: Generate Essays Online | Brobex",
    description: "Plan and draft essays with an AI-assisted writing workspace. Review and refine generated content before using it.",
    keywords: ["AI essay writer", "essay generator", "online essay writing tool"],
  },
  "paragraph-writer": {
    title: "AI Paragraph Writer: Generate Paragraphs Online | Brobex",
    description: "Create and refine paragraphs with an AI-assisted writing tool. Adjust your prompt and review the generated text.",
    keywords: ["AI paragraph writer", "paragraph generator", "paragraph writing tool"],
  },
  "paragraph-completer": {
    title: "AI Paragraph Completer: Finish Text Online | Brobex",
    description: "Continue unfinished writing with an AI-assisted paragraph completion tool. Review and edit the suggested text before use.",
    keywords: ["paragraph completer", "finish a paragraph", "AI writing assistant"],
  },
  "content-improver": {
    title: "AI Content Improver: Refine & Rewrite Text | Brobex",
    description: "Improve clarity, tone, and readability with an AI-assisted content refinement workspace. Review every suggested change.",
    keywords: ["AI content improver", "text refiner", "improve writing online"],
  },
  "signature-generator": {
    title: "Free Online Signature Generator & Signature Maker | Brobex",
    description: "Create a free digital signature online. Draw with a mouse, stylus, or finger, or type your name. Download a high-resolution transparent PNG or JPEG. No paid API or sign-up required.",
    keywords: ["free online signature generator", "signature maker", "draw signature online", "digital signature image", "transparent signature PNG"],
    ogTitle: "Free Online Signature Generator – Draw or Type Your Signature | BROBEX",
  },
  "chart-maker": {
    title: "Online Chart & Graph Maker: Create Visual Charts | Brobex",
    description: "Create and customize bar charts, line graphs, and pie charts with the BROBEX online chart maker.",
    keywords: ["online chart maker", "graph generator online", "create bar chart"],
  },
};

function buildCopy(tool: ToolDefinition): SeoCopy {
  const slug = tool.slug;
  if (seoBySlug[slug]) return seoBySlug[slug];

  if (/^compress-(image|jpeg)-to-/.test(slug) || /^resize-image-to-/.test(slug)) {
    return {
      title: `Compress Image to ${slug.match(/\d+(?:mb|kb)/i)?.[0]?.toUpperCase() ?? "Target Size"} Online | Brobex`,
      description: `Compress and prepare an image toward a ${slug.match(/\d+(?:mb|kb)/i)?.[0]?.toUpperCase() ?? "specific"} target file size for forms, portals, and uploads. Check the resulting file size before downloading.`,
      keywords: ["compress image to specific KB", `compress image to ${slug.match(/\d+(?:mb|kb)/i)?.[0] ?? "target size"}`, "reduce image file size online"],
    };
  }

  const conversion = slug.match(/^([a-z0-9]+)-to-([a-z0-9]+)$/i);
  if (conversion) {
    const from = conversion[1].toUpperCase();
    const to = conversion[2].toUpperCase();
    return {
      title: `Convert ${from} to ${to} Online Free | Brobex`,
      description: `Convert ${from} files to ${to} online with the BROBEX file conversion workspace. No software installation is required; check format support and review the exported file.`,
      keywords: [`convert ${from.toLowerCase()} to ${to.toLowerCase()}`, `online ${from} to ${to} converter`, "free file converter"],
    };
  }

  const name = tool.name.replace(/\s+/g, " ").trim();
  const topic = name.toLowerCase();
  return {
    title: `${name} Online Free | BROBEX Tools`,
    description: `${tool.description.replace(/[.!?]+$/, "")}. Use the BROBEX ${name.toLowerCase()} workspace online and review your result before exporting.`,
    keywords: [topic, `${topic} online`, `free ${topic} tool`],
  };
}

export function getToolMetadata(tool: ToolDefinition): Metadata {
  const copy = buildCopy(tool);
  const canonical = `${SITE}/tools/${tool.slug}`;
  const ogTitle = copy.ogTitle ?? copy.title;
  return {
    title: { absolute: copy.title },
    description: copy.description,
    keywords: copy.keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: "BROBEX Image Tools",
      title: ogTitle,
      description: copy.description,
      url: canonical,
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description: copy.description,
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  };
}

