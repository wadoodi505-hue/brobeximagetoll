import type { ToolGuideData } from "@/components/tool-guide";
import signatureGeneratorGuide from "@/content/tool-guides/signature-generator.json";
import guide0 from "@/content/tool-guides/remove-background-from-image.json";
import guide1 from "@/content/tool-guides/upscale-image.json";
import guide2 from "@/content/tool-guides/colorize-photo.json";
import guide3 from "@/content/tool-guides/make-background-transparent.json";
import guide4 from "@/content/tool-guides/blur-background.json";
import guide5 from "@/content/tool-guides/blur-any-object.json";
import guide6 from "@/content/tool-guides/translate-image.json";
import guide7 from "@/content/tool-guides/image-to-text.json";
import guide8 from "@/content/tool-guides/tiff-to-text.json";
import guide9 from "@/content/tool-guides/resize-image-dimensions.json";
import guide10 from "@/content/tool-guides/compress-image-size.json";
import guide11 from "@/content/tool-guides/crop-image.json";
import guide12 from "@/content/tool-guides/square-crop.json";
import guide13 from "@/content/tool-guides/triangle-crop.json";
import guide14 from "@/content/tool-guides/shape-crop.json";
import guide15 from "@/content/tool-guides/aspect-ratio-crop.json";
import guide16 from "@/content/tool-guides/black-white.json";
import guide17 from "@/content/tool-guides/pixelate-image.json";
import guide18 from "@/content/tool-guides/add-text-to-image.json";
import guide19 from "@/content/tool-guides/add-border-to-image.json";
import guide20 from "@/content/tool-guides/combine-images.json";
import guide21 from "@/content/tool-guides/add-images-to-image.json";
import guide22 from "@/content/tool-guides/make-round-image.json";
import guide23 from "@/content/tool-guides/profile-photo-maker.json";
import guide24 from "@/content/tool-guides/image-splitter.json";
import guide25 from "@/content/tool-guides/collage-maker.json";
import guide26 from "@/content/tool-guides/chart-maker.json";
import guide27 from "@/content/tool-guides/view-metadata.json";
import guide28 from "@/content/tool-guides/font-awesome-to-png.json";
import guide29 from "@/content/tool-guides/png-to-jpg.json";
import guide30 from "@/content/tool-guides/jpg-to-png.json";
import guide31 from "@/content/tool-guides/png-to-webp.json";
import guide32 from "@/content/tool-guides/webp-to-png.json";
import guide33 from "@/content/tool-guides/jpg-to-webp.json";
import guide34 from "@/content/tool-guides/webp-to-jpg.json";
import guide35 from "@/content/tool-guides/png-to-svg.json";
import guide36 from "@/content/tool-guides/jpg-to-svg.json";
import guide37 from "@/content/tool-guides/svg-to-png.json";
import guide38 from "@/content/tool-guides/heic-to-jpg.json";
import guide39 from "@/content/tool-guides/heic-to-png.json";
import guide40 from "@/content/tool-guides/heic-to-avif.json";
import guide41 from "@/content/tool-guides/tiff-to-jpg.json";
import guide42 from "@/content/tool-guides/tiff-to-png.json";
import guide43 from "@/content/tool-guides/tiff-to-svg.json";
import guide44 from "@/content/tool-guides/jpg-to-tiff.json";
import guide45 from "@/content/tool-guides/png-to-tiff.json";
import guide46 from "@/content/tool-guides/jpg-to-avif.json";
import guide47 from "@/content/tool-guides/png-to-avif.json";
import guide48 from "@/content/tool-guides/webp-to-avif.json";
import guide49 from "@/content/tool-guides/gif-to-jpg.json";
import guide50 from "@/content/tool-guides/gif-to-png.json";
import guide51 from "@/content/tool-guides/gif-to-webp.json";
import guide52 from "@/content/tool-guides/gif-to-avif.json";
import guide53 from "@/content/tool-guides/gif-to-apng.json";
import guide54 from "@/content/tool-guides/webp-to-gif.json";
import guide55 from "@/content/tool-guides/eps-to-png.json";
import guide56 from "@/content/tool-guides/eps-to-jpg.json";
import guide57 from "@/content/tool-guides/eps-to-svg.json";
import guide58 from "@/content/tool-guides/png-to-eps.json";
import guide59 from "@/content/tool-guides/psd-to-jpg.json";
import guide60 from "@/content/tool-guides/psd-to-png.json";
import guide61 from "@/content/tool-guides/psd-to-svg.json";
import guide62 from "@/content/tool-guides/psd-to-ai.json";
import guide63 from "@/content/tool-guides/pdf-to-jpg.json";
import guide64 from "@/content/tool-guides/merge-pdf.json";
import guide65 from "@/content/tool-guides/split-pdf.json";
import guide66 from "@/content/tool-guides/compress-pdf.json";
import guide67 from "@/content/tool-guides/edit-pdf.json";
import guide68 from "@/content/tool-guides/jpg-to-pdf.json";
import guide69 from "@/content/tool-guides/pdf-to-word.json";
import guide70 from "@/content/tool-guides/gif-to-mp4.json";
import guide71 from "@/content/tool-guides/vsd-to-pdf.json";
import guide72 from "@/content/tool-guides/vsd-to-docx.json";
import guide73 from "@/content/tool-guides/vsd-to-pptx.json";
import guide74 from "@/content/tool-guides/vsd-to-jpg.json";
import guide75 from "@/content/tool-guides/vsdx-to-pdf.json";
import guide76 from "@/content/tool-guides/vsdx-to-docx.json";
import guide77 from "@/content/tool-guides/vsdx-to-pptx.json";
import guide78 from "@/content/tool-guides/vsdx-to-jpg.json";
import guide79 from "@/content/tool-guides/general-file-converter.json";
import guide80 from "@/content/tool-guides/content-improver.json";
import guide81 from "@/content/tool-guides/essay-writer.json";
import guide82 from "@/content/tool-guides/paragraph-writer.json";
import guide83 from "@/content/tool-guides/paragraph-completer.json";
import guide84 from "@/content/tool-guides/passport-photo-maker.json";
import guide85 from "@/content/tool-guides/compress-image-to-5kb.json";
import guide86 from "@/content/tool-guides/compress-jpeg-to-10kb.json";
import guide87 from "@/content/tool-guides/compress-image-to-15kb.json";
import guide88 from "@/content/tool-guides/compress-image-to-20kb.json";
import guide89 from "@/content/tool-guides/compress-jpeg-between-20kb-to-50kb.json";
import guide90 from "@/content/tool-guides/compress-jpeg-to-25kb.json";
import guide91 from "@/content/tool-guides/compress-jpeg-to-30kb.json";
import guide92 from "@/content/tool-guides/compress-jpeg-to-40kb.json";
import guide93 from "@/content/tool-guides/compress-image-to-50kb.json";
import guide94 from "@/content/tool-guides/compress-image-to-60kb.json";
import guide95 from "@/content/tool-guides/compress-image-to-70kb.json";
import guide96 from "@/content/tool-guides/compress-image-to-80kb.json";
import guide97 from "@/content/tool-guides/compress-image-to-90kb.json";
import guide98 from "@/content/tool-guides/resize-image-to-50kb.json";
import guide99 from "@/content/tool-guides/compress-image-to-100kb.json";
import guide100 from "@/content/tool-guides/compress-jpeg-to-150kb.json";
import guide101 from "@/content/tool-guides/compress-image-to-200kb.json";
import guide102 from "@/content/tool-guides/resize-image-to-200kb.json";
import guide103 from "@/content/tool-guides/compress-jpeg-to-300kb.json";
import guide104 from "@/content/tool-guides/compress-jpeg-to-500kb.json";
import guide105 from "@/content/tool-guides/compress-image-to-1mb.json";
import guide106 from "@/content/tool-guides/compress-image-to-2mb.json";

import increaseImageFileSizeGuide from "@/content/tool-guides/increase-image-file-size.json";
import rotateFlipImageGuide from "@/content/tool-guides/flip-image.json";
import convertMbToKbGuide from "@/content/tool-guides/convert-mb-to-kb.json";
import convertKbToMbGuide from "@/content/tool-guides/convert-kb-to-mb.json";

export const toolGuides: Record<string, ToolGuideData> = {
  "signature-generator": signatureGeneratorGuide,
  "increase-image-file-size": increaseImageFileSizeGuide,
  "convert-mb-to-kb": convertMbToKbGuide,
  "convert-kb-to-mb": convertKbToMbGuide,
  "flip-image": rotateFlipImageGuide,
  "remove-background-from-image": guide0,
  "upscale-image": guide1,
  "colorize-photo": guide2,
  "make-background-transparent": guide3,
  "blur-background": guide4,
  "blur-any-object": guide5,
  "translate-image": guide6,
  "image-to-text": guide7,
  "tiff-to-text": guide8,
  "resize-image-dimensions": guide9,
  "compress-image-size": guide10,
  "crop-image": guide11,
  "square-crop": guide12,
  "triangle-crop": guide13,
  "shape-crop": guide14,
  "aspect-ratio-crop": guide15,
  "black-white": guide16,
  "pixelate-image": guide17,
  "add-text-to-image": guide18,
  "add-border-to-image": guide19,
  "combine-images": guide20,
  "add-images-to-image": guide21,
  "make-round-image": guide22,
  "profile-photo-maker": guide23,
  "image-splitter": guide24,
  "collage-maker": guide25,
  "chart-maker": guide26,
  "view-metadata": guide27,
  "font-awesome-to-png": guide28,
  "png-to-jpg": guide29,
  "jpg-to-png": guide30,
  "png-to-webp": guide31,
  "webp-to-png": guide32,
  "jpg-to-webp": guide33,
  "webp-to-jpg": guide34,
  "png-to-svg": guide35,
  "jpg-to-svg": guide36,
  "svg-to-png": guide37,
  "heic-to-jpg": guide38,
  "heic-to-png": guide39,
  "heic-to-avif": guide40,
  "tiff-to-jpg": guide41,
  "tiff-to-png": guide42,
  "tiff-to-svg": guide43,
  "jpg-to-tiff": guide44,
  "png-to-tiff": guide45,
  "jpg-to-avif": guide46,
  "png-to-avif": guide47,
  "webp-to-avif": guide48,
  "gif-to-jpg": guide49,
  "gif-to-png": guide50,
  "gif-to-webp": guide51,
  "gif-to-avif": guide52,
  "gif-to-apng": guide53,
  "webp-to-gif": guide54,
  "eps-to-png": guide55,
  "eps-to-jpg": guide56,
  "eps-to-svg": guide57,
  "png-to-eps": guide58,
  "psd-to-jpg": guide59,
  "psd-to-png": guide60,
  "psd-to-svg": guide61,
  "psd-to-ai": guide62,
  "pdf-to-jpg": guide63,
  "merge-pdf": guide64,
  "split-pdf": guide65,
  "compress-pdf": guide66,
  "edit-pdf": guide67,
  "jpg-to-pdf": guide68,
  "pdf-to-word": guide69,
  "gif-to-mp4": guide70,
  "vsd-to-pdf": guide71,
  "vsd-to-docx": guide72,
  "vsd-to-pptx": guide73,
  "vsd-to-jpg": guide74,
  "vsdx-to-pdf": guide75,
  "vsdx-to-docx": guide76,
  "vsdx-to-pptx": guide77,
  "vsdx-to-jpg": guide78,
  "general-file-converter": guide79,
  "content-improver": guide80,
  "essay-writer": guide81,
  "paragraph-writer": guide82,
  "paragraph-completer": guide83,
  "passport-photo-maker": guide84,
  "compress-image-to-5kb": guide85,
  "compress-jpeg-to-10kb": guide86,
  "compress-image-to-15kb": guide87,
  "compress-image-to-20kb": guide88,
  "compress-jpeg-between-20kb-to-50kb": guide89,
  "compress-jpeg-to-25kb": guide90,
  "compress-jpeg-to-30kb": guide91,
  "compress-jpeg-to-40kb": guide92,
  "compress-image-to-50kb": guide93,
  "compress-image-to-60kb": guide94,
  "compress-image-to-70kb": guide95,
  "compress-image-to-80kb": guide96,
  "compress-image-to-90kb": guide97,
  "resize-image-to-50kb": guide98,
  "compress-image-to-100kb": guide99,
  "compress-jpeg-to-150kb": guide100,
  "compress-image-to-200kb": guide101,
  "resize-image-to-200kb": guide102,
  "compress-jpeg-to-300kb": guide103,
  "compress-jpeg-to-500kb": guide104,
  "compress-image-to-1mb": guide105,
  "compress-image-to-2mb": guide106,
};

export function getToolGuide(slug: string): ToolGuideData | undefined {
  return toolGuides[slug];
}



