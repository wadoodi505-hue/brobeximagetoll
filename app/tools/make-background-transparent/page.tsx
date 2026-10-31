import BackgroundRemover from "@/components/ai/background-remover";

export const metadata = {
  title: "Make Background Transparent | BROBEX",
  description:
    "Create transparent images using AI-powered background segmentation. Preview and export transparent PNG images with BROBEX Image Studio.",
};

export default function MakeBackgroundTransparentPage() {
  return <BackgroundRemover />;
}
