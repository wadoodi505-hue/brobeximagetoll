"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { removeImageBackground } from "@/lib/ai/remove-background";

type ResultImage = {
  url: string;
  blob: Blob;
};

const MAX_FILE_SIZE = 12 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15.5v3A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v3h16v-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BackgroundRemover() {
  const inputRef = useRef<HTMLInputElement>(null);
  const originalUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [result, setResult] = useState<ResultImage | null>(null);
  const [processing, setProcessing] = useState(false);
const [progress, setProgress] = useState(0);
const [statusMessage, setStatusMessage] = useState("");
const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    return () => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  const chooseFile = useCallback((selected: File | undefined) => {
    if (!selected) return;

    setError("");
    setResult(null);

    if (!selected.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError("This image is larger than 12 MB. Choose a smaller image.");
      return;
    }

    if (originalUrlRef.current) {
      URL.revokeObjectURL(originalUrlRef.current);
    }
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }

    const nextUrl = URL.createObjectURL(selected);
    originalUrlRef.current = nextUrl;

    setFile(selected);
    setOriginalUrl(nextUrl);
  }, []);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const processImage = async () => {
    if (!file || processing) return;

 setProcessing(true);
setProgress(0);
setStatusMessage("Preparing AI engine...");
setError("");
setResult(null);

    try {
     const blob = await removeImageBackground(file, {
  onProgress: ({ stage, current }) => {
    setProgress(current);
    setStatusMessage(
      `${stage.replace(/[-_]/g, " ")} · ${current}%`,
    );
  },
});

      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
      }

      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ url, blob });
      setShowOriginal(false);
    } catch (cause) {
      console.error("Background removal failed:", cause);

      const message =
        cause instanceof Error ? cause.message : "";

      setError(
        message.toLowerCase().includes("fetch") ||
        message.toLowerCase().includes("network") ||
        message.toLowerCase().includes("load")
          ? "The AI model could not be downloaded. Check your internet connection or DNS settings, then try again."
          : message ||
              "Background removal failed. Try another image or reload the page.",
      );
   } finally {
  setProcessing(false);
  setStatusMessage("");
  setProgress(0);
}
  };

  const reset = () => {
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);

    originalUrlRef.current = null;
    resultUrlRef.current = null;

    setFile(null);
    setOriginalUrl("");
    setResult(null);
    setError("");
    setProcessing(false);
    setShowOriginal(false);

    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadResult = () => {
    if (!result) return;

    const link = document.createElement("a");
    link.href = result.url;
    link.download = `${file?.name.replace(/\.[^.]+$/, "") || "brobex-image"}-no-background.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#080a0a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(183,103,60,0.13),transparent_48%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:52px_52px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
       <Link
  href="/"
  className="text-lg font-black tracking-[0.2em] text-white"
  aria-label="BROBEX home"
>
  BROBEX<span className="text-[#c77b53]">.</span>
</Link>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Browser-based AI
          </div>
        </header>

        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c77b53]/25 bg-[#c77b53]/[0.08] px-3 py-1.5 text-xs font-medium tracking-wide text-[#e4a17d]">
            <span className="h-4 w-4">
              <SparkIcon />
            </span>
            BROBEX IMAGE STUDIO
          </div>

          <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
            Remove backgrounds.
            <span className="mt-2 block bg-gradient-to-r from-[#f0c3a7] via-[#c77b53] to-[#e6a17b] bg-clip-text text-transparent">
              Keep the subject.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
            Create a clean, transparent image with AI-powered subject
            segmentation. Upload a photo, process it, and export your PNG.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/45">
            
            <span>✓ Transparent PNG export</span>
            <span>✓ Up to 12 MB per image</span>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-5xl rounded-3xl border border-white/10 bg-[#101313]/90 p-4 shadow-2xl shadow-black/30 sm:mt-14 sm:p-7">
          {!file ? (
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDragging(false);
                }
              }}
              onDrop={onDrop}
              className={`flex min-h-[310px] flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-12 text-center transition sm:min-h-[360px] ${
                dragging
                  ? "border-[#d99a75] bg-[#c77b53]/10"
                  : "border-white/20 bg-white/[0.015] hover:border-white/35 hover:bg-white/[0.03]"
              }`}
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c77b53]/25 bg-[#c77b53]/10 text-[#e4a17d]">
                <span className="h-8 w-8">
                  <UploadIcon />
                </span>
              </div>

              <h2 className="text-xl font-semibold tracking-tight">
                Upload your image
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
                Drag and drop your photo here, or browse your device to get
                started.
              </p>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#c77b53] px-6 py-3 text-sm font-semibold text-[#160d09] transition hover:bg-[#dfa17e] focus:outline-none focus:ring-2 focus:ring-[#dfa17e] focus:ring-offset-2 focus:ring-offset-[#101313]"
              >
                <span className="h-5 w-5">
                  <UploadIcon />
                </span>
                Choose image
              </button>

              <p className="mt-4 text-xs text-white/35">
                JPG, PNG or WebP · Maximum 12 MB
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {formatBytes(file.size)}
                    {result ? " · Background removed" : " · Ready to process"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  disabled={processing}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 transition hover:border-white/25 hover:text-white disabled:opacity-40"
                >
                  Start over
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#090b0b]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="text-xs font-medium text-white/70">
                      Original image
                    </span>
                    <span className="rounded-md bg-white/[0.07] px-2 py-1 text-[10px] text-white/45">
                      SOURCE
                    </span>
                  </div>
                  <div className="flex min-h-[250px] items-center justify-center p-4 sm:min-h-[340px]">
                    {originalUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={originalUrl}
                        alt="Original image before background removal"
                        className="max-h-[420px] max-w-full rounded-lg object-contain"
                      />
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#090b0b]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <span className="text-xs font-medium text-white/70">
                      Transparent result
                    </span>
                    <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
                      {result ? "READY" : processing ? "PROCESSING" : "PREVIEW"}
                    </span>
                  </div>

                  <div className="checkerboard relative flex min-h-[250px] items-center justify-center overflow-hidden p-4 sm:min-h-[340px]">
                    {result ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={showOriginal ? originalUrl : result.url}
                        alt={
                          showOriginal
                            ? "Original image comparison"
                            : "Image with background removed and transparency preserved"
                        }
                        className="relative z-10 max-h-[420px] max-w-full rounded-lg object-contain"
                      />
                    ) : (
                      <div className="relative z-10 flex max-w-xs flex-col items-center px-5 text-center">
                        {processing ? (
                         <>
  <div
    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c77b53]/30 bg-[#c77b53]/10"
    aria-hidden="true"
  >
    <SparkIcon />
  </div>

  <p className="text-sm font-medium text-white">
    Removing your background
  </p>

  <p
    className="mt-2 max-w-xs text-xs leading-5 text-white/50"
    aria-live="polite"
  >
    {statusMessage || "Preparing the AI engine…"}
  </p>

  <div
    className="mt-5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10"
    role="progressbar"
    aria-label="Background removal progress"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={progress}
  >
    <div
      className="h-full rounded-full bg-gradient-to-r from-[#a95835] via-[#d99a75] to-[#f0c3a7] transition-[width] duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>

  <p className="mt-2 text-[11px] tabular-nums text-white/40">
    {progress}% complete
  </p>

  <p className="mt-3 max-w-xs text-xs leading-5 text-white/40">
    The first run may take longer while the AI model downloads.
  </p>
</>
                        ) : (
                          <>
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/35">
                              <span className="h-6 w-6">
                                <SparkIcon />
                              </span>
                            </div>
                            <p className="text-sm font-medium text-black">
  Your result will appear here
</p>
<p className="mt-2 text-xs text-black/65">
  Transparent areas display as a checkerboard.
</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm leading-6 text-red-200"
                >
                  <p className="font-medium">Unable to process image</p>
                  <p className="mt-1 text-red-100/75">{error}</p>
                  <button
                    type="button"
                    onClick={processImage}
                    disabled={processing}
                    className="mt-3 rounded-lg border border-red-200/20 px-3 py-2 text-xs font-medium transition hover:bg-red-200/10 disabled:opacity-40"
                  >
                    Try again
                  </button>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {!result ? (
                  <button
                    type="button"
                    onClick={processImage}
                    disabled={processing}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c77b53] px-5 py-3.5 text-sm font-semibold text-[#160d09] transition hover:bg-[#dfa17e] focus:outline-none focus:ring-2 focus:ring-[#dfa17e] disabled:cursor-wait disabled:opacity-60 sm:flex-none"
                  >
                    <span className="h-5 w-5">
                      <SparkIcon />
                    </span>
                    {processing ? "Removing background…" : "Remove background"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={downloadResult}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c77b53] px-5 py-3.5 text-sm font-semibold text-[#160d09] transition hover:bg-[#dfa17e] focus:outline-none focus:ring-2 focus:ring-[#dfa17e] sm:flex-none"
                    >
                      <span className="h-5 w-5">
                        <DownloadIcon />
                      </span>
                      Download transparent PNG
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOriginal((value) => !value)}
                      className="rounded-xl border border-white/10 px-4 py-3.5 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
                    >
                      {showOriginal ? "Show result" : "Compare original"}
                    </button>
                  </>
                )}
              </div>

              {result && (
                <p className="mt-4 text-xs leading-5 text-white/40">
                  Export ready. Your PNG retains its transparency. Results
                  depend on the source image and the AI model’s segmentation
                  quality.
                </p>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/*"
            onChange={onInputChange}
            className="sr-only"
            aria-label="Choose an image to remove its background"
          />
        </section>

        <section className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-3">
          {[
            {
              number: "01",
              title: "Upload",
              description: "Choose a clear photo of the subject.",
            },
            {
              number: "02",
              title: "AI processing",
              description: "Let the segmentation model isolate the subject.",
            },
            {
              number: "03",
              title: "Export",
              description: "Download your transparent PNG and use it anywhere.",
            },
          ].map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
            >
              <p className="text-xs tracking-[0.18em] text-[#d99a75]">
                {step.number}
              </p>
              <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
              <p className="mt-2 text-xs leading-5 text-white/45">
                {step.description}
              </p>
            </div>
          ))}
        </section>

        <footer className="mt-12 text-center text-xs text-white/30">
          BROBEX IMAGE STUDIO · AI-powered image editing
        </footer>
      </div>

      <style jsx>{`
        .checkerboard {
          background-color: #f2f2f2;
          background-image: linear-gradient(45deg, #d5d5d5 25%, transparent 25%),
            linear-gradient(-45deg, #d5d5d5 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #d5d5d5 75%),
            linear-gradient(-45deg, transparent 75%, #d5d5d5 75%);
          background-position:
            0 0,
            0 10px,
            10px -10px,
            -10px 0;
          background-size: 20px 20px;
        }

        @media (prefers-reduced-motion: reduce) {
          .checkerboard {
            scroll-behavior: auto;
          }
        }
      `}</style>
    </main>
  );
}

