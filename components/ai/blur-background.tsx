"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { removeImageBackground } from "@/lib/ai/remove-background";

const MAX_FILE_SIZE = 12 * 1024 * 1024;

type Output = { blob: Blob; url: string };

export default function BlurBackground() {
  const inputRef = useRef<HTMLInputElement>(null);
  const originalUrlRef = useRef<string | null>(null);
  const outputUrlRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [foreground, setForeground] = useState<Blob | null>(null);
  const [output, setOutput] = useState<Output | null>(null);
  const [blur, setBlur] = useState(14);
  const [processing, setProcessing] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
  }, []);

  const chooseFile = useCallback((selected?: File) => {
    if (!selected) return;
    setError("");
    if (!selected.type.startsWith("image/")) {
      setError("Please choose a valid image.");
      return;
    }
    if (!selected.size || selected.size > MAX_FILE_SIZE) {
      setError("Choose an image smaller than 12 MB.");
      return;
    }

    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    originalUrlRef.current = URL.createObjectURL(selected);
    outputUrlRef.current = null;

    setFile(selected);
    setOriginalUrl(originalUrlRef.current);
    setForeground(null);
    setOutput(null);
    setBlur(14);
    setProgress(0);
  }, []);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    chooseFile(event.target.files?.[0]);
    event.target.value = "";
  };

  useEffect(() => {
    if (!file || !foreground) return;
    let cancelled = false;

    const render = async () => {
      try {
        setRendering(true);
        const [backgroundBitmap, subjectBitmap] = await Promise.all([
          createImageBitmap(file),
          createImageBitmap(foreground),
        ]);

        const canvas = document.createElement("canvas");
        canvas.width = backgroundBitmap.width;
        canvas.height = backgroundBitmap.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not prepare the image canvas.");

        const width = canvas.width;
        const height = canvas.height;
        const padding = Math.ceil(blur * 2);

        context.save();
        context.filter = `blur(${blur}px)`;
        context.drawImage(backgroundBitmap, -padding, -padding, width + padding * 2, height + padding * 2);
        context.restore();
        context.drawImage(subjectBitmap, 0, 0, width, height);

        backgroundBitmap.close();
        subjectBitmap.close();

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (value) => value ? resolve(value) : reject(new Error("Could not render the blurred image.")),
            "image/png",
          );
        });
        canvas.width = 0;
        canvas.height = 0;

        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
        outputUrlRef.current = url;
        setOutput({ blob, url });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Preview rendering failed.");
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    void render();
    return () => { cancelled = true; };
  }, [file, foreground, blur]);

  const processImage = async () => {
    if (!file || processing) return;
    setProcessing(true);
    setError("");
    setOutput(null);
    setForeground(null);
    setProgress(0);
    setStatus("Preparing AI engine…");

    try {
      const subject = await removeImageBackground(file, {
        onProgress: ({ stage, current }) => {
          setProgress(current);
          setStatus(`${stage.replace(/[-_]/g, " ")} · ${current}%`);
        },
      });
      setForeground(subject);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Background segmentation failed.");
    } finally {
      setProcessing(false);
      setStatus("");
    }
  };

  const reset = () => {
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    originalUrlRef.current = null;
    outputUrlRef.current = null;
    setFile(null);
    setOriginalUrl("");
    setForeground(null);
    setOutput(null);
    setError("");
    setProgress(0);
    setBlur(14);
    if (inputRef.current) inputRef.current.value = "";
  };

  const download = () => {
    if (!output || !file) return;
    const link = document.createElement("a");
    link.href = output.url;
    link.download = `${file.name.replace(/\.[^.]+$/, "")}-blurred-background.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#080a0a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(183,103,60,0.13),transparent_48%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-black tracking-[0.2em]">BROBEX<span className="text-[#c77b53]">.</span></Link>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65">Browser-based AI</span>
        </header>

        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-[#c77b53]/25 bg-[#c77b53]/[0.08] px-3 py-1.5 text-xs tracking-wide text-[#e4a17d]">BROBEX IMAGE STUDIO</span>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
            Blur the background.
            <span className="mt-2 block bg-gradient-to-r from-[#f0c3a7] via-[#c77b53] to-[#e6a17b] bg-clip-text text-transparent">Keep the focus.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
            Isolate your subject with AI, soften the background, and control the blur strength. Export a high-quality PNG.
          </p>
        </section>

        <section className="mx-auto mt-10 max-w-5xl rounded-3xl border border-white/10 bg-[#101313]/90 p-4 shadow-2xl sm:mt-14 sm:p-7">
          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-[310px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.015] px-5 py-12 text-center transition hover:border-[#d99a75] hover:bg-[#c77b53]/[0.06] sm:min-h-[360px]"
            >
              <span className="text-4xl text-[#d99a75]">＋</span>
              <span className="mt-4 text-xl font-semibold">Upload your image</span>
              <span className="mt-2 text-sm text-white/50">Choose a photo to create a professional depth-of-field effect.</span>
              <span className="mt-6 rounded-xl bg-[#c77b53] px-6 py-3 text-sm font-semibold text-[#160d09]">Choose image</span>
              <span className="mt-4 text-xs text-white/35">JPG, PNG or WebP · Maximum 12 MB</span>
            </button>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="mt-1 text-xs text-white/45">{(file.size / 1024 / 1024).toFixed(2)} MB · {foreground ? "Subject isolated" : "Ready to process"}</p>
                </div>
                <button type="button" onClick={reset} disabled={processing} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 hover:border-white/25 disabled:opacity-40">Start over</button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#090b0b]">
                  <div className="border-b border-white/10 px-4 py-3 text-xs text-white/65">Original image</div>
                  <div className="flex min-h-[250px] items-center justify-center p-4 sm:min-h-[340px]">
                    <img src={originalUrl} alt="Original image" className="max-h-[420px] max-w-full rounded-lg object-contain" />
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#090b0b]">
                  <div className="border-b border-white/10 px-4 py-3 text-xs text-white/65">Blurred background preview</div>
                  <div className="flex min-h-[250px] items-center justify-center p-4 sm:min-h-[340px]">
                    {output ? (
                      <img src={output.url} alt="Sharp subject with blurred background" className="max-h-[420px] max-w-full rounded-lg object-contain" />
                    ) : (
                      <div className="max-w-xs text-center text-sm text-white/40">
                        {processing ? `${status || "Processing image"} (${progress}%)` : "Your blurred result will appear here."}
                        {processing && <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#c77b53] transition-all" style={{ width: `${progress}%` }} /></div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-200">{error}</p>}

              {!foreground ? (
                <button type="button" onClick={processImage} disabled={processing} className="mt-5 w-full rounded-xl bg-[#c77b53] px-5 py-3.5 text-sm font-semibold text-[#160d09] transition hover:bg-[#dfa17e] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
                  {processing ? "Isolating subject…" : "AI blur background"}
                </button>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold">Blur strength</h2>
                      <p className="mt-1 text-xs text-white/45">Adjust the background softness.</p>
                    </div>
                    <span className="rounded-lg border border-[#c77b53]/30 px-3 py-2 text-sm tabular-nums text-[#e4a17d]">{blur}px</span>
                  </div>
                  <input type="range" min="0" max="40" step="1" value={blur} onChange={(event) => setBlur(Number(event.target.value))} className="mt-5 w-full accent-[#c77b53]" aria-label="Background blur strength" />
                  <div className="mt-2 flex justify-between text-xs text-white/35"><span>Subtle</span><span>Strong</span></div>
                  <button type="button" onClick={download} disabled={!output || rendering} className="mt-6 w-full rounded-xl bg-[#c77b53] px-5 py-3.5 text-sm font-semibold text-[#160d09] transition hover:bg-[#dfa17e] disabled:opacity-50 sm:w-auto">
                    {rendering ? "Updating preview…" : "Download blurred PNG"}
                  </button>
                </div>
              )}
            </>
          )}
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/*" onChange={onInputChange} className="sr-only" aria-label="Choose an image" />
        </section>

        <section className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-3">
          {[
            ["01", "Upload", "Choose a clear photo with a visible subject."],
            ["02", "AI isolation", "The segmentation model separates the foreground."],
            ["03", "Adjust & export", "Set your blur strength and save the PNG."],
          ].map(([number, title, description]) => (
            <div key={number} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <p className="text-xs tracking-[0.18em] text-[#d99a75]">{number}</p>
              <h3 className="mt-3 text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-white/45">{description}</p>
            </div>
          ))}
        </section>
        <footer className="mt-12 text-center text-xs text-white/30">BROBEX IMAGE STUDIO · AI-powered image editing</footer>
      </div>
    </main>
  );
}

