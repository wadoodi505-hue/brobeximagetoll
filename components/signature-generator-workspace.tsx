
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import {
  Download,
  Eraser,
  RotateCcw,
  PenLine,
  Type,
  ShieldCheck,
  Check,
} from "lucide-react";

type Mode = "draw" | "type";
type ExportFormat = "png" | "jpg";

type SignatureFont = {
  label: string;
  family: string;
  category: string;
  style?: string;
};

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 560;
const MAX_HISTORY = 20;

const SIGNATURE_FONTS: Record<string, SignatureFont> = {
  allura: { label: "Allura", family: "Allura", category: "Signature Scripts" },
  alexBrush: { label: "Alex Brush", family: "Alex Brush", category: "Signature Scripts" },
  greatVibes: { label: "Great Vibes", family: "Great Vibes", category: "Signature Scripts" },
  parisienne: { label: "Parisienne", family: "Parisienne", category: "Signature Scripts" },
  pinyon: { label: "Pinyon Script", family: "Pinyon Script", category: "Signature Scripts" },
  italianno: { label: "Italianno", family: "Italianno", category: "Signature Scripts" },

  dancing: { label: "Dancing Script", family: "Dancing Script", category: "Handwriting" },
  caveat: { label: "Caveat", family: "Caveat", category: "Handwriting" },
  satisfy: { label: "Satisfy", family: "Satisfy", category: "Handwriting" },
  sacramento: { label: "Sacramento", family: "Sacramento", category: "Handwriting" },
  tangerine: { label: "Tangerine", family: "Tangerine", category: "Handwriting" },
  marck: { label: "Marck Script", family: "Marck Script", category: "Handwriting" },

  petit: { label: "Petit Formal Script", family: "Petit Formal Script", category: "Decorative Scripts" },
  rouge: { label: "Rouge Script", family: "Rouge Script", category: "Decorative Scripts" },
  berkshire: { label: "Berkshire Swash", family: "Berkshire Swash", category: "Decorative Scripts" },
  yesteryear: { label: "Yesteryear", family: "Yesteryear", category: "Decorative Scripts" },

  cormorant: { label: "Cormorant Garamond", family: "Cormorant Garamond", category: "Professional Serif", style: "italic" },
  playfair: { label: "Playfair Display", family: "Playfair Display", category: "Professional Serif", style: "italic" },
  baskerville: { label: "Libre Baskerville", family: "Libre Baskerville", category: "Professional Serif", style: "italic" },
  lora: { label: "Lora", family: "Lora", category: "Professional Serif", style: "italic" },
  dmserif: { label: "DM Serif Display", family: "DM Serif Display", category: "Professional Serif", style: "italic" },

  montserrat: { label: "Montserrat", family: "Montserrat", category: "Modern Professional" },
  manrope: { label: "Manrope", family: "Manrope", category: "Modern Professional" },
  inter: { label: "Inter", family: "Inter", category: "Modern Professional" },
  raleway: { label: "Raleway", family: "Raleway", category: "Modern Professional" },
};

const FONT_GROUPS = [
  "Signature Scripts",
  "Handwriting",
  "Decorative Scripts",
  "Professional Serif",
  "Modern Professional",
];

const FONT_NAMES = Object.values(SIGNATURE_FONTS).map(
  (font) => font.family
);

function loadSignatureFonts(): Promise<boolean> {
  return new Promise((resolve) => {
    const existing = document.getElementById(
      "brobex-signature-google-fonts"
    ) as HTMLLinkElement | null;

    if (existing?.dataset.loaded === "true") {
      resolve(true);
      return;
    }

    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://fonts.googleapis.com";
    document.head.appendChild(preconnect);

    const preconnectStatic = document.createElement("link");
    preconnectStatic.rel = "preconnect";
    preconnectStatic.href = "https://fonts.gstatic.com";
    preconnectStatic.crossOrigin = "anonymous";
    document.head.appendChild(preconnectStatic);

    const params = new URLSearchParams();

    FONT_NAMES.forEach((name) => {
      params.append("family", name);
    });

    params.set("display", "swap");

    const stylesheet = document.createElement("link");
    stylesheet.id = "brobex-signature-google-fonts";
    stylesheet.rel = "stylesheet";
    stylesheet.href =
      `https://fonts.googleapis.com/css2?${params.toString()}`;

    stylesheet.onload = () => {
      stylesheet.dataset.loaded = "true";
      resolve(true);
    };

    stylesheet.onerror = () => resolve(false);

    document.head.appendChild(stylesheet);
  });
}

export function SignatureGeneratorWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);

  const [mode, setMode] = useState<Mode>("draw");
  const [signature, setSignature] = useState("");
  const [font, setFont] = useState("greatVibes");
  const [ink, setInk] = useState("#111111");
  const [stroke, setStroke] = useState(5);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [transparent, setTransparent] = useState(true);
  const [hasInk, setHasInk] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [message, setMessage] = useState("");
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontLoadFailed, setFontLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;

    loadSignatureFonts().then((loaded) => {
      if (!active) return;

      setFontsLoaded(true);
      setFontLoadFailed(!loaded);
    });

    return () => {
      active = false;
    };
  }, []);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;

    return canvas
      ? canvas.getContext("2d", { willReadFrequently: true })
      : null;
  }, []);

  const paintTypedSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!signature.trim()) {
      setHasInk(false);
      return;
    }

    const selectedFont =
      SIGNATURE_FONTS[font] ?? SIGNATURE_FONTS.greatVibes;

    const family = `"${selectedFont.family}", cursive`;
    const style = selectedFont.style ?? "normal";

    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let fitted = 118;

    ctx.font = `${style} ${fitted}px ${family}`;

    while (
      ctx.measureText(signature).width > canvas.width - 120 &&
      fitted > 32
    ) {
      fitted -= 4;
      ctx.font = `${style} ${fitted}px ${family}`;
    }

    ctx.fillText(
      signature,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width - 120
    );

    setHasInk(true);
    historyRef.current = [];
    setHistoryCount(0);
  }, [font, getContext, ink, signature]);

  useEffect(() => {
    if (mode !== "type" || !fontsLoaded) return;

    let cancelled = false;

    const renderSignature = async () => {
      const selectedFont =
        SIGNATURE_FONTS[font] ?? SIGNATURE_FONTS.greatVibes;

      const style = selectedFont.style ?? "normal";

      try {
        await document.fonts.load(
          `${style} 118px "${selectedFont.family}"`
        );
      } catch {
        // Continue with the browser's fallback font.
      }

      if (!cancelled) {
        paintTypedSignature();
      }
    };

    void renderSignature();

    return () => {
      cancelled = true;
    };
  }, [mode, font, fontsLoaded, paintTypedSignature]);

  const pointFromEvent = (
    event: PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (
    event: PointerEvent<HTMLCanvasElement>
  ) => {
    if (mode !== "draw") return;

    const canvas = canvasRef.current;
    const ctx = getContext();

    if (!canvas || !ctx) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);

    const snapshot = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    historyRef.current = [
      ...historyRef.current.slice(-(MAX_HISTORY - 1)),
      snapshot,
    ];

    setHistoryCount(historyRef.current.length);

    drawingRef.current = true;

    const point = pointFromEvent(event);

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + 0.1, point.y + 0.1);

    ctx.strokeStyle = ink;
    ctx.lineWidth = stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    setHasInk(true);
    setMessage("");
  };

  const continueDrawing = (
    event: PointerEvent<HTMLCanvasElement>
  ) => {
    if (!drawingRef.current || mode !== "draw") return;

    const ctx = getContext();

    if (!ctx) return;

    event.preventDefault();

    const point = pointFromEvent(event);

    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = ink;
    ctx.lineWidth = stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    historyRef.current = [];

    setHistoryCount(0);
    setHasInk(false);
    setMessage("Signature canvas cleared.");
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    const previous = historyRef.current.pop();

    if (!canvas || !ctx || !previous) return;

    ctx.putImageData(previous, 0, 0);

    setHistoryCount(historyRef.current.length);

    const pixels = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    ).data;

    let visible = false;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) {
        visible = true;
        break;
      }
    }

    setHasInk(visible);
    setMessage("");
  };

  const exportSignature = () => {
    const canvas = canvasRef.current;

    if (!canvas || !hasInk) {
      setMessage("Create a signature before downloading.");
      return;
    }

    const output = document.createElement("canvas");

    output.width = CANVAS_WIDTH;
    output.height = CANVAS_HEIGHT;

    const ctx = output.getContext("2d");

    if (!ctx) {
      setMessage("Could not prepare the export. Please try again.");
      return;
    }

    if (format === "jpg" || !transparent) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, output.width, output.height);
    }

    ctx.drawImage(canvas, 0, 0);

    const mime =
      format === "jpg" ? "image/jpeg" : "image/png";

    output.toBlob(
      (blob) => {
        if (!blob) {
          setMessage("Export failed. Please try another browser.");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `brobex-signature.${format}`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);

        setMessage(
          `${format.toUpperCase()} signature downloaded successfully.`
        );
      },
      mime,
      format === "jpg" ? 0.96 : undefined
    );
  };

  const resetSettings = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();

    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    historyRef.current = [];
    drawingRef.current = false;

    setMode("draw");
    setSignature("");
    setFont("greatVibes");
    setInk("#111111");
    setStroke(5);
    setFormat("png");
    setTransparent(true);
    setHasInk(false);
    setHistoryCount(0);
    setMessage("Signature settings have been reset.");
  };

  const selectedFont =
    SIGNATURE_FONTS[font] ?? SIGNATURE_FONTS.greatVibes;

  return (
    <section
      className="brobex-signature"
      aria-label="Signature generator workspace"
    >
      <header className="brobex-signature-head">
        <div>
          <span className="brobex-signature-kicker">
            BROBEX CREATIVE STUDIO
          </span>

          <h2>Create Your Digital Signature</h2>

          <p>
            Create a personal signature with professional typography
            or draw your own.
          </p>
        </div>

        <span className="brobex-signature-private">
          <ShieldCheck size={15} />
          Private - Signature text stays in your browser
        </span>
      </header>

      <div className="brobex-signature-layout">
        <div className="brobex-signature-editor">
          <div
            className="brobex-signature-toolbar"
            role="group"
            aria-label="Signature mode"
          >
            <button
              type="button"
              className={mode === "draw" ? "is-active" : ""}
              onClick={() => {
                if (mode !== "draw") clearCanvas();
                setMode("draw");
                setMessage("");
              }}
            >
              <PenLine size={16} />
              Draw signature
            </button>

            <button
              type="button"
              className={mode === "type" ? "is-active" : ""}
              onClick={() => {
                setMode("type");
                setMessage("");
              }}
            >
              <Type size={16} />
              Type signature
            </button>

            <span className="brobex-signature-canvas-label">
              1600 x 560 px canvas
            </span>
          </div>

          {mode === "type" && (
            <div className="brobex-signature-typed-controls">
              <label>
                Full name or signature text

                <input
                  value={signature}
                  onChange={(event) =>
                    setSignature(event.target.value.slice(0, 48))
                  }
                  maxLength={48}
                  placeholder="Type your name"
                />
              </label>

              <label>
                Signature font

                <select
                  value={font}
                  onChange={(event) => setFont(event.target.value)}
                  disabled={!fontsLoaded}
                >
                  {FONT_GROUPS.map((group) => (
                    <optgroup key={group} label={group}>
                      {Object.entries(SIGNATURE_FONTS)
                        .filter(([, item]) => item.category === group)
                        .map(([value, item]) => (
                          <option key={value} value={value}>
                            {item.label}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <div className="brobex-signature-font-preview">
                <span>Selected font preview</span>
                <strong
                  style={{
                    fontFamily: `"${selectedFont.family}", cursive`,
                    fontStyle: selectedFont.style ?? "normal",
                  }}
                >
                  {signature.trim() || "Your Signature"}
                </strong>
                <small>{selectedFont.label}</small>
              </div>

              {!fontsLoaded && (
                <p className="brobex-signature-message" role="status">
                  Loading professional fonts...
                </p>
              )}

              {fontLoadFailed && (
                <p className="brobex-signature-message" role="status">
                  Online fonts could not load. Browser fallback fonts
                  will be used.
                </p>
              )}
            </div>
          )}

          <div
            className={`brobex-signature-paper ${transparent ? "is-transparent" : "is-white"
              }`}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              aria-label={
                mode === "draw"
                  ? "Draw your signature here"
                  : "Typed signature preview"
              }
              onPointerDown={startDrawing}
              onPointerMove={continueDrawing}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={stopDrawing}
              onLostPointerCapture={stopDrawing}
              style={{
                touchAction: mode === "draw" ? "none" : "auto",
                cursor: mode === "draw" ? "crosshair" : "default",
              }}
            />

            {!hasInk && mode === "draw" && (
              <span className="brobex-signature-placeholder">
                Sign here using your mouse, stylus, or finger
              </span>
            )}

            {!hasInk && mode === "type" && (
              <span className="brobex-signature-placeholder">
                Your typed signature preview will appear here
              </span>
            )}
          </div>

          <div className="brobex-signature-actions">
            <button
              type="button"
              onClick={undo}
              disabled={mode !== "draw" || historyCount === 0}
            >
              <RotateCcw size={15} />
              Undo
            </button>

            <button type="button" onClick={clearCanvas}>
              <Eraser size={15} />
              Clear canvas
            </button>

            <span>
              {mode === "draw"
                ? "Use a steady stroke for a smoother result."
                : "Choose a font and enter your name above."}
            </span>
          </div>
        </div>

        <aside className="brobex-signature-settings">
          <h3>Signature settings</h3>

          {mode === "draw" && (
            <label>
              Pen thickness
              <output>{stroke}px</output>
              <input
                type="range"
                min="1"
                max="18"
                value={stroke}
                onChange={(event) =>
                  setStroke(Number(event.target.value))
                }
              />
            </label>
          )}

          <label>
            Ink color
            <input
              type="color"
              value={ink}
              onChange={(event) => setInk(event.target.value)}
            />
          </label>

          <label className="brobex-signature-check">
            <input
              type="checkbox"
              checked={transparent}
              onChange={(event) =>
                setTransparent(event.target.checked)
              }
            />
            Transparent background
          </label>

          <label>
            Download format
            <select
              value={format}
              onChange={(event) =>
                setFormat(event.target.value as ExportFormat)
              }
            >
              <option value="png">PNG - Supports transparency</option>
              <option value="jpg">JPEG - White background</option>
            </select>
          </label>

          <div className="brobex-signature-note">
            <strong>Export quality</strong>
            <span>
              High-resolution 1600 x 560 px image. PNG preserves
              transparent pixels.
            </span>
          </div>

          <button
            type="button"
            className="brobex-signature-download"
            onClick={exportSignature}
            disabled={!hasInk}
          >
            <Download size={17} />
            Download signature
          </button>

          <button
            type="button"
            className="brobex-signature-reset"
            onClick={resetSettings}
          >
            Reset settings
          </button>

          {message && (
            <p className="brobex-signature-message" role="status">
              {message}
            </p>
          )}

          <p className="brobex-signature-footnote">
            Your signature text and drawing stay in your browser.
            Professional fonts are loaded from Google Fonts. A
            generated image is not a verified electronic-signature
            certificate.
          </p>
        </aside>
      </div>
    </section>
  );
}
