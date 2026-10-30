
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  Download,
  Eraser,
  ImagePlus,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_PIXELS = 8_000_000;
const MAX_ENGINE_WAIT_MS = 45_000;
const OPENCV_SCRIPT_PATH = "https://docs.opencv.org/4.x/opencv.js";
const OPENCV_SCRIPT_ATTRIBUTE = "data-brobex-opencv";

type OpenCVMat = {
  delete: () => void;
};

type OpenCV = {
  Mat: new () => OpenCVMat;
  imread: (
    source: HTMLImageElement | HTMLCanvasElement
  ) => OpenCVMat;
  imshow: (
    canvas: HTMLCanvasElement,
    mat: OpenCVMat
  ) => void;
  cvtColor: (
    source: OpenCVMat,
    destination: OpenCVMat,
    code: number
  ) => void;
  threshold: (
    source: OpenCVMat,
    destination: OpenCVMat,
    threshold: number,
    maxValue: number,
    type: number
  ) => void;
  inpaint: (
    source: OpenCVMat,
    mask: OpenCVMat,
    destination: OpenCVMat,
    radius: number,
    method: number
  ) => void;
  COLOR_RGBA2RGB: number;
  COLOR_RGBA2GRAY: number;
  COLOR_RGB2RGBA: number;
  THRESH_BINARY: number;
  INPAINT_TELEA: number;
};

type OpenCVRuntime = OpenCV & {
  onRuntimeInitialized?: () => void;
  onAbort?: (reason?: unknown) => void;
};

declare global {
  interface Window {
    cv?: OpenCVRuntime | Promise<OpenCVRuntime>;
  }
}

type ImageDimensions = {
  width: number;
  height: number;
};

function isOpenCVReady(value: unknown): value is OpenCV {
  if (!value || typeof value !== "object") {
    return false;
  }

  const engine = value as Partial<OpenCV>;

  return (
    typeof engine.Mat === "function" &&
    typeof engine.imread === "function" &&
    typeof engine.imshow === "function" &&
    typeof engine.cvtColor === "function" &&
    typeof engine.threshold === "function" &&
    typeof engine.inpaint === "function" &&
    typeof engine.COLOR_RGBA2RGB === "number" &&
    typeof engine.COLOR_RGBA2GRAY === "number" &&
    typeof engine.COLOR_RGB2RGBA === "number" &&
    typeof engine.THRESH_BINARY === "number" &&
    typeof engine.INPAINT_TELEA === "number"
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred. Please try again.";
}

function releaseMat(mat: OpenCVMat | null): void {
  if (!mat) return;

  try {
    mat.delete();
  } catch {
    // Continue releasing other matrices if one cleanup fails.
  }
}

function revokeObjectUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function PhotoCleanupWorkspace() {
  const imageRef = useRef<HTMLImageElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLCanvasElement>(null);

  const cvRef = useRef<OpenCV | null>(null);
  const drawingRef = useRef(false);
  const busyRef = useRef(false);
  const dimensionsRef = useRef<ImageDimensions | null>(null);
  const pendingPreviewRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionVersionRef = useRef(0);
  const engineAttemptRef = useRef(0);

  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [brush, setBrush] = useState(32);
  const [radius, setRadius] = useState(5);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    "Loading the local processing engine…"
  );
  const [engineAttempt, setEngineAttempt] = useState(0);
  const [engineRequested, setEngineRequested] = useState(false);

  const clearResult = useCallback(() => {
    setResultUrl("");
  }, []);

  // Load OpenCV through its browser runtime, avoiding a Node.js import
  // in the Next.js server/client bundling pipeline.

  // Load OpenCV from its official hosted runtime.
  useEffect(() => {
    if (!engineRequested) {
      setMessage("Ready when you are. Start the engine to process images.");
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let startedAt = Date.now();
    let script: HTMLScriptElement | null = null;
    let scriptFailed = false;
    let promiseObserved = false;

    const stopTimer = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    const fail = (reason: string) => {
      if (cancelled) return;

      stopTimer();
      cvRef.current = null;
      setReady(false);
      setError(reason);
      setMessage("");
    };

    const acceptEngine = (candidate: unknown) => {
      if (cancelled || !isOpenCVReady(candidate)) return false;

      stopTimer();
      cvRef.current = candidate;
      setReady(true);
      setError("");
      setMessage(
        "Processing engine ready. Your images stay on this device."
      );

      return true;
    };

    const checkEngine = () => {
      if (cancelled) return;

      const candidate = window.cv;

      if (acceptEngine(candidate)) return;

      if (
        candidate &&
        typeof candidate === "object" &&
        "then" in candidate &&
        typeof candidate.then === "function"
      ) {
        if (!promiseObserved) {
          promiseObserved = true;

          Promise.resolve(candidate)
            .then((engine: unknown) => {
              if (cancelled) return;

              if (!acceptEngine(engine)) {
                fail(
                  "OpenCV loaded, but its required image-processing functions are missing."
                );
              }
            })
            .catch((reason: unknown) => {
              fail(
                `OpenCV runtime initialization failed: ${getErrorMessage(reason)}`
              );
            });
        }
      }

      if (scriptFailed) {
        fail(
          "OpenCV could not be loaded. Check your internet connection, browser console, and the OpenCV CDN."
        );
        return;
      }

      if (Date.now() - startedAt >= MAX_ENGINE_WAIT_MS) {
        fail(
          "OpenCV timed out while initializing. Refresh the page and check whether the OpenCV script or WebAssembly runtime is blocked."
        );
        return;
      }

      timer = setTimeout(checkEngine, 500);
    };

    const handleScriptLoad = () => {
      if (script) script.dataset.loaded = "true";
      checkEngine();
    };

    const handleScriptError = () => {
      scriptFailed = true;
      fail(
        "Could not download OpenCV. Check your internet connection or try again later."
      );
    };

    if (acceptEngine(window.cv)) {
      return () => {
        cancelled = true;
      };
    }

    script = document.querySelector<HTMLScriptElement>(
      `script[${OPENCV_SCRIPT_ATTRIBUTE}="true"]`
    );

    // Remove a previous failed script so retry can load it again.
    if (script?.dataset.failed === "true") {
      script.remove();
      script = null;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = OPENCV_SCRIPT_PATH;
      script.async = true;
      script.setAttribute(OPENCV_SCRIPT_ATTRIBUTE, "true");
      script.addEventListener("load", handleScriptLoad);
      script.addEventListener("error", handleScriptError);
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", handleScriptLoad);
      script.addEventListener("error", handleScriptError);
    }

    startedAt = Date.now();
    setReady(false);
    setError("");
    setMessage("Loading the local processing engine…");

    checkEngine();

    return () => {
      cancelled = true;
      stopTimer();
      script?.removeEventListener("load", handleScriptLoad);
      script?.removeEventListener("error", handleScriptError);
    };
  }, [engineAttempt, engineRequested]);

  // Release image URLs whenever the displayed preview changes or unmounts.
  useEffect(() => {
    return () => {
      revokeObjectUrl(preview);
    };
  }, [preview]);

  // Release the exported result URL whenever it is replaced or unmounted.
  useEffect(() => {
    return () => {
      revokeObjectUrl(resultUrl);
    };
  }, [resultUrl]);

  // A file can still be decoding when the user resets or selects another file.
  useEffect(() => {
    return () => {
      if (pendingPreviewRef.current) {
        revokeObjectUrl(pendingPreviewRef.current);
        pendingPreviewRef.current = null;
      }
    };
  }, []);

  // Initialize both canvases after React renders the selected image workspace.
  useEffect(() => {
    if (!preview) return;

    const dimensions = dimensionsRef.current;
    const mask = maskRef.current;
    const result = resultRef.current;

    if (!dimensions || !mask || !result) {
      setError("Could not initialize the image workspace.");
      return;
    }

    mask.width = dimensions.width;
    mask.height = dimensions.height;

    const maskContext = mask.getContext("2d");

    if (!maskContext) {
      setError("Could not initialize the selection canvas.");
      return;
    }

    maskContext.clearRect(0, 0, mask.width, mask.height);

    result.width = dimensions.width;
    result.height = dimensions.height;

    const resultContext = result.getContext("2d");

    if (resultContext) {
      resultContext.clearRect(0, 0, result.width, result.height);
    }

    selectionVersionRef.current += 1;
    drawingRef.current = false;
  }, [preview]);

  function chooseFile(file?: File) {
    if (!file || busyRef.current) return;

    setError("");
    setMessage("");

    const allowedTypes = new Set([
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/avif",
    ]);

    if (!allowedTypes.has(file.type.toLowerCase())) {
      setError("Choose a PNG, JPEG, WebP, or AVIF image.");
      return;
    }

    if (file.size <= 0) {
      setError("The selected file is empty.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError("The file exceeds the 20 MB limit.");
      return;
    }

    if (pendingPreviewRef.current) {
      revokeObjectUrl(pendingPreviewRef.current);
      pendingPreviewRef.current = null;
    }

    const url = URL.createObjectURL(file);
    const probe = new Image();

    pendingPreviewRef.current = url;

    probe.onload = () => {
      if (pendingPreviewRef.current !== url) return;

      const width = probe.naturalWidth;
      const height = probe.naturalHeight;

      if (width <= 0 || height <= 0) {
        revokeObjectUrl(url);
        pendingPreviewRef.current = null;
        setError("The image has invalid dimensions.");
        return;
      }

      if (width * height > MAX_PIXELS) {
        revokeObjectUrl(url);
        pendingPreviewRef.current = null;
        setError(
          "This image exceeds 8 megapixels. Resize it before processing to reduce browser memory use."
        );
        return;
      }

      dimensionsRef.current = { width, height };
      pendingPreviewRef.current = null;

      setPreview(url);
      setFileName(file.name);
      setResultUrl("");
      setError("");
      setMessage("Paint over the unwanted object to select it.");
    };

    probe.onerror = () => {
      if (pendingPreviewRef.current !== url) return;

      revokeObjectUrl(url);
      pendingPreviewRef.current = null;
      setError(
        "The browser could not decode this image. Try exporting it as PNG, JPEG, or WebP."
      );
      setMessage("");
    };

    probe.src = url;
  }

  function getPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return { x: 0, y: 0 };
    }

    return {
      x: Math.max(
        0,
        Math.min(
          canvas.width,
          ((event.clientX - rect.left) / rect.width) * canvas.width
        )
      ),
      y: Math.max(
        0,
        Math.min(
          canvas.height,
          ((event.clientY - rect.top) / rect.height) * canvas.height
        )
      ),
    };
  }

  function startDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (busyRef.current || !preview) return;

    const canvas = maskRef.current;
    const context = canvas?.getContext("2d");

    if (
      !canvas ||
      !context ||
      canvas.width <= 0 ||
      canvas.height <= 0
    ) {
      return;
    }

    event.preventDefault();

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional; drawing still works without it.
    }

    drawingRef.current = true;
    clearResult();
    setError("");
    setMessage("Selection updated. Run removal when you are ready.");

    const point = getPoint(event);
    const rect = canvas.getBoundingClientRect();

    // The brush setting is in CSS pixels. Convert it to source-image pixels.
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    const lineWidth = brush * (scaleX + scaleY) / 2;

    context.strokeStyle = "#ffffff";
    context.fillStyle = "#ffffff";
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    // Draw a dot as well as starting a path so taps select pixels.
    context.beginPath();
    context.arc(point.x, point.y, lineWidth / 2, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.moveTo(point.x, point.y);

    selectionVersionRef.current += 1;
  }

  function draw(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || busyRef.current) return;

    event.preventDefault();

    const canvas = event.currentTarget;
    const context = canvas.getContext("2d");

    if (!context) return;

    const point = getPoint(event);

    context.lineTo(point.x, point.y);
    context.stroke();
    selectionVersionRef.current += 1;
  }

  function stopDrawing() {
    if (!drawingRef.current) return;

    drawingRef.current = false;
    maskRef.current?.getContext("2d")?.closePath();
  }

  async function processImage() {
    if (busyRef.current) return;

    const cv = cvRef.current;
    const image = imageRef.current;
    const maskCanvas = maskRef.current;
    const resultCanvas = resultRef.current;

    if (!ready || !cv || !isOpenCVReady(cv)) {
      setError("The local processing engine is not ready yet.");
      return;
    }

    if (
      !image ||
      !maskCanvas ||
      !resultCanvas ||
      !image.naturalWidth ||
      !image.naturalHeight
    ) {
      setError("Upload an image and wait for its preview to appear.");
      return;
    }

    if (
      image.naturalWidth !== maskCanvas.width ||
      image.naturalHeight !== maskCanvas.height
    ) {
      setError("The image workspace is still initializing. Try again.");
      return;
    }

    if (
      maskCanvas.width <= 0 ||
      maskCanvas.height <= 0 ||
      maskCanvas.width * maskCanvas.height > MAX_PIXELS
    ) {
      setError("The image dimensions are invalid or exceed the processing limit.");
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError("");
    setMessage("Reconstructing the selected area on your device…");

    let source: OpenCVMat | null = null;
    let rgb: OpenCVMat | null = null;
    let maskRgba: OpenCVMat | null = null;
    let gray: OpenCVMat | null = null;
    let binary: OpenCVMat | null = null;
    let destination: OpenCVMat | null = null;
    let rgba: OpenCVMat | null = null;

    try {
      stopDrawing();

      const maskContext = maskCanvas.getContext("2d", {
        willReadFrequently: true,
      });

      if (!maskContext) {
        throw new Error("Could not read the selection canvas.");
      }

      const pixels = maskContext.getImageData(
        0,
        0,
        maskCanvas.width,
        maskCanvas.height
      ).data;

      let hasSelection = false;

      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > 0) {
          hasSelection = true;
          break;
        }
      }

      if (!hasSelection) {
        throw new Error("Paint over the unwanted object before processing.");
      }

      source = cv.imread(image);
      rgb = new cv.Mat();
      cv.cvtColor(source, rgb, cv.COLOR_RGBA2RGB);

      maskRgba = cv.imread(maskCanvas);
      gray = new cv.Mat();
      cv.cvtColor(maskRgba, gray, cv.COLOR_RGBA2GRAY);

      binary = new cv.Mat();
      cv.threshold(
        gray,
        binary,
        1,
        255,
        cv.THRESH_BINARY
      );

      destination = new cv.Mat();

      cv.inpaint(
        rgb,
        binary,
        destination,
        radius,
        cv.INPAINT_TELEA
      );

      rgba = new cv.Mat();
      cv.cvtColor(
        destination,
        rgba,
        cv.COLOR_RGB2RGBA
      );

      cv.imshow(resultCanvas, rgba);

      const blob = await new Promise<Blob>((resolve, reject) => {
        resultCanvas.toBlob(
          (value) => {
            if (value && value.size > 0) {
              resolve(value);
            } else {
              reject(
                new Error("Could not export the processed image.")
              );
            }
          },
          "image/png"
        );
      });

      const nextResultUrl = URL.createObjectURL(blob);

      setResultUrl(nextResultUrl);
      setMessage(
        "Processing complete. Compare the result with your original image before downloading."
      );
    } catch (processingError) {
      setError(getErrorMessage(processingError));
      setMessage("");
    } finally {
      releaseMat(rgba);
      releaseMat(destination);
      releaseMat(binary);
      releaseMat(gray);
      releaseMat(maskRgba);
      releaseMat(rgb);
      releaseMat(source);

      busyRef.current = false;
      setBusy(false);
    }
  }

  function clearSelection() {
    if (busyRef.current) return;

    drawingRef.current = false;

    const canvas = maskRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    selectionVersionRef.current += 1;
    clearResult();
    setError("");
    setMessage("Selection cleared. Paint over the object to select it.");
  }

  function resetWorkspace() {
    if (busyRef.current) return;

    if (pendingPreviewRef.current) {
      revokeObjectUrl(pendingPreviewRef.current);
      pendingPreviewRef.current = null;
    }

    dimensionsRef.current = null;
    drawingRef.current = false;
    selectionVersionRef.current += 1;

    setPreview("");
    setFileName("");
    setResultUrl("");
    setError("");
    setMessage("Choose an image to start.");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function retryEngine() {
    if (ready) return;

    setError("");
    setMessage("Retrying the local processing engine…");
    engineAttemptRef.current += 1;
    setEngineAttempt(engineAttemptRef.current);
  }

  return (
    <section className="workspace">
      <div className="workspace-top">
        <div>
          <span className="eyebrow">
            BROBEX · LOCAL IMAGE STUDIO
          </span>

          <h2>Remove Objects from Photo</h2>

          <p>
            Select an unwanted object and reconstruct its area using
            surrounding image pixels.
          </p>
        </div>

        <span className="privacy-chip">Local processing</span>
      </div>

      <label className={`dropzone ${preview ? "has-file" : ""}`}>
        <ImagePlus size={28} aria-hidden="true" />

        <strong>{fileName || "Choose an image"}</strong>

        <span>
          PNG, JPEG, WebP or AVIF · 20 MB maximum · 8 megapixels maximum
        </span>

        <small>
          Image processing runs in your browser, not on a processing server.
        </small>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          disabled={busy}
          onChange={(event) => {
            const input = event.currentTarget;
            const selectedFile = input.files?.[0];

            chooseFile(selectedFile);

            // Permit selecting the same file again.
            input.value = "";
          }}
        />
      </label>

      {!ready && (
        <div className="workspace-actions">
          <button
            className="button button-light"
            type="button"
            onClick={retryEngine}
          >
            <RotateCcw size={15} />
            Retry engine
          </button>
        </div>
      )}

      {preview && (
        <>
          <div className="settings-panel">
            <label>
              <span>Brush size: {brush}px</span>

              <input
                type="range"
                min="8"
                max="100"
                step="1"
                value={brush}
                disabled={busy}
                onChange={(event) =>
                  setBrush(Number(event.target.value))
                }
              />
            </label>

            <label>
              <span>Inpainting radius: {radius}px</span>

              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={radius}
                disabled={busy}
                onChange={(event) =>
                  setRadius(Number(event.target.value))
                }
              />
            </label>

            <p className="hint">
              Cover the complete object, including its edges. A tight,
              accurate selection usually produces cleaner results.
              Increase the radius cautiously for slightly larger gaps.
            </p>
          </div>

          <div className="preview-panel">
            <div className="panel-heading">
              Paint the unwanted area
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 900,
                margin: "0 auto",
                lineHeight: 0,
                overflow: "hidden",
              }}
            >
              <img
                ref={imageRef}
                src={preview}
                alt="Original image to edit"
                draggable={false}
                onLoad={() => {
                  const image = imageRef.current;
                  const dimensions = dimensionsRef.current;

                  if (
                    image &&
                    dimensions &&
                    (image.naturalWidth !== dimensions.width ||
                      image.naturalHeight !== dimensions.height)
                  ) {
                    setError(
                      "The displayed image dimensions do not match the workspace."
                    );
                  }
                }}
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: "100%",
                  height: "auto",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />

              <canvas
                ref={maskRef}
                aria-label="Selection brush canvas"
                role="img"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onLostPointerCapture={stopDrawing}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "block",
                  width: "100%",
                  height: "100%",
                  maxWidth: "100%",
                  touchAction: "none",
                  cursor: busy ? "wait" : "crosshair",
                  opacity: 0.5,
                }}
              />
            </div>
          </div>

          <div className="workspace-actions">
            <button
              className="button button-dark"
              type="button"
              disabled={busy || !preview}
              onClick={processImage}
            >
              <Sparkles size={16} aria-hidden="true" />
              {busy ? "Processing…" : "Remove selected object"}
            </button>
            {!ready && (
              <button
                className="button button-dark"
                type="button"
                disabled={busy}
                onClick={() => setEngineRequested(true)}
              >
                Start free processing engine
              </button>
            )}

            <button
              className="button button-light"
              type="button"
              disabled={busy}
              onClick={clearSelection}
            >
              <Eraser size={15} aria-hidden="true" />
              Clear selection
            </button>

            <button
              className="button button-light"
              type="button"
              disabled={busy}
              onClick={resetWorkspace}
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reset
            </button>
          </div>

          <div className="preview-panel">
            <div className="panel-heading">
              Processed result
            </div>

            {resultUrl ? (
              <>

                <div
                  style={{
                    width: "100%",
                    maxWidth: 900,
                    margin: "0 auto",
                    overflow: "hidden",
                  }}
                >
                  <canvas
                    ref={resultRef}
                    aria-label="Processed image result"
                    style={{
                      display: resultUrl ? "block" : "none",
                      width: "100%",
                      maxWidth: "100%",
                      height: "auto",
                    }}
                  />
                </div>

                <a
                  className="button button-dark download-button"
                  href={resultUrl}
                  download="brobex-photo-cleanup.png"
                >
                  <Download size={16} aria-hidden="true" />
                  Download PNG
                </a>
              </>
            ) : (
              <p className="hint">
                Your edited image will appear here after processing.
              </p>
            )}
          </div>
        </>
      )}

      {message && (
        <p role="status" aria-live="polite" className="notice success">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" aria-live="assertive" className="notice error">
          {error}
        </p>
      )}

      <p className="hint">
        OpenCV inpainting is free and local, but it is not generative AI.
        It works best for small objects against relatively simple
        backgrounds. Complex textures, faces, text, and large objects
        may leave visible artifacts.
      </p>
    </section>
  );
}

