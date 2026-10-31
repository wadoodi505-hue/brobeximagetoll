import BlurAnyObject from "@/components/ai/blur-any-object";

export const metadata = {
  alternates: { canonical: "/tools/blur-any-object" },
  title: "Blur Any Object | BROBEX",
  description:
    "Blur any object or selected area in an image using a precise brush, adjustable blur intensity, and an eraser. Free browser-based image editing.",
};

export default function BlurAnyObjectPage() {
  return <BlurAnyObject />;
}
