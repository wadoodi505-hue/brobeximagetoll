
import BackgroundRemover from "@/components/ai/background-remover";

export const metadata = {
  title: "Remove Background from Image | BROBEX",
  description:
    "Remove image backgrounds with AI and export transparent PNG images using BROBEX Image Studio.",
};

export default function RemoveBackgroundPage() {
  return <BackgroundRemover />;
}
