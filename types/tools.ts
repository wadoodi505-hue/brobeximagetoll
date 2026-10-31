export type Category = "image" | "pdf" | "write" | "video" | "file";
export type ToolStatus = "browser" | "integration";
export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  category: Category;
  icon: string;
  acceptedTypes: string[];
  method: string;
  status: ToolStatus;
  operation?: "resize" | "compress" | "crop" | "flip" | "grayscale" | "pixelate" | "text" | "border" | "combine" | "circle" | "metadata" | "blur" | "convert" | "rotate" | "unblur" | "png-to-svg" | "square-crop" | "triangle-crop" | "shape-crop" | "aspect-ratio-crop" ;
  outputMime?: string;
  outputExtension?: string;
};

