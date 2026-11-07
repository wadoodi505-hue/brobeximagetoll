export type ExactTargetTool = {
  slug: string;
  name: string;
  targetKb: number;
  description: string;
  outputFormat?: "image/jpeg" | "image/webp" | "image/png";
  minTargetKb?: number;
};

export const exactTargetTools: ExactTargetTool[] = [
  { slug: "compress-image-to-5kb", name: "Compress to 5KB", targetKb: 5, description: "Compress an image to 5KB or less while retaining original dimensions whenever possible." },
  { slug: "compress-jpeg-to-10kb", name: "JPEG to 10KB", targetKb: 10, description: "Compress an image to 10KB or less while retaining original dimensions whenever possible." , outputFormat: "image/jpeg" },
  { slug: "compress-image-to-15kb", name: "Compress to 15KB", targetKb: 15, description: "Compress an image to 15KB or less while retaining original dimensions whenever possible." },
  { slug: "compress-image-to-20kb", name: "Compress to 20KB", targetKb: 20, description: "Compress an image to 20KB or less while retaining original dimensions whenever possible." },
  { slug: "compress-jpeg-between-20kb-to-50kb", name: "Compress 20KB–50KB", targetKb: 50, description: "Optimize an image with a 50 KB maximum target and a 20 KB lower guidance threshold.", minTargetKb: 20 },
  { slug: "compress-jpeg-to-25kb", name: "JPEG to 25KB", targetKb: 25, description: "Compress an image to 25KB or less while retaining original dimensions whenever possible." , outputFormat: "image/jpeg" },
  { slug: "compress-jpeg-to-30kb", name: "JPEG to 30KB", targetKb: 30, description: "Compress an image to 30KB or less while retaining original dimensions whenever possible." , outputFormat: "image/jpeg" },
  { slug: "compress-jpeg-to-40kb", name: "JPEG to 40KB", targetKb: 40, description: "Compress an image to 40KB or less while retaining original dimensions whenever possible." , outputFormat: "image/jpeg" },
  { slug: "compress-image-to-50kb", name: "Compress to 50KB", targetKb: 50, description: "Compress an image to 50KB or less while retaining original dimensions whenever possible." },
  { slug: "compress-image-to-60kb", name: "Compress to 60KB", targetKb: 60, description: "Compress an image to 60KB or less while retaining original dimensions whenever possible." },
  { slug: "compress-image-to-70kb", name: "Compress to 70KB", targetKb: 70, description: "Compress an image to 70KB or less while retaining original dimensions whenever possible." },
  { slug: "compress-image-to-80kb", name: "Compress to 80KB", targetKb: 80, description: "Compress an image to 80KB or less while retaining original dimensions whenever possible." },
  { slug: "compress-image-to-90kb", name: "Compress to 90KB", targetKb: 90, description: "Compress an image to 90KB or less while retaining original dimensions whenever possible." },
  { slug: "resize-image-to-50kb", name: "Resize to 50KB", targetKb: 50, description: "Compress an image to 50KB or less while retaining original dimensions whenever possible." },
  { slug: "compress-image-to-100kb", name: "Compress to 100KB", targetKb: 100, description: "Compress an image to 100KB or less while retaining original dimensions whenever possible." },
  { slug: "compress-jpeg-to-150kb", name: "JPEG to 150KB", targetKb: 150, description: "Compress an image to 150KB or less while retaining original dimensions whenever possible." , outputFormat: "image/jpeg" },
  { slug: "compress-image-to-200kb", name: "Compress to 200KB", targetKb: 200, description: "Compress an image to 200KB or less while retaining original dimensions whenever possible." },
  { slug: "resize-image-to-200kb", name: "Resize to 200KB", targetKb: 200, description: "Compress an image to 200KB or less while retaining original dimensions whenever possible." },
  { slug: "compress-jpeg-to-300kb", name: "JPEG to 300KB", targetKb: 300, description: "Compress an image to 300KB or less while retaining original dimensions whenever possible." , outputFormat: "image/jpeg" },
  { slug: "compress-jpeg-to-500kb", name: "JPEG to 500KB", targetKb: 500, description: "Compress an image to 500KB or less while retaining original dimensions whenever possible." , outputFormat: "image/jpeg" },
  { slug: "compress-image-to-1mb", name: "Compress to 1MB", targetKb: 1024, description: "Compress an image to 1MB or less while retaining original dimensions whenever possible." },
  { slug: "compress-image-to-2mb", name: "Compress to 2MB", targetKb: 2048, description: "Compress an image to 2MB or less while retaining original dimensions whenever possible." }
];

export function getExactTargetTool(slug: string) {
  return exactTargetTools.find((tool) => tool.slug === slug);
}
