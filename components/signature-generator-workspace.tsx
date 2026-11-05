
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ChangeEvent,
} from "react";

import {
  Download,
  Eraser,
  RotateCcw,
  PenLine,
  Type,
  ShieldCheck,
  Upload,
  Move,
  RotateCw,
  ImagePlus,
  X,
} from "lucide-react";

type Mode = "draw" | "type";
type ExportFormat = "png" | "jpg";
type BackgroundMode = "transparent" | "color" | "image";

type SignatureFont = {
  label: string;
  family: string;
  category: string;
  style?: string;
};

type SignaturePosition = {
  x: number;
  y: number;
};

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 560;
const MAX_HISTORY = 20;
const MAX_BACKGROUND_SIZE = 15 * 1024 * 1024;

const SIGNATURE_FONTS: Record<string, SignatureFont> = {
  allura: {
    label: "Allura",
    family: "Allura",
    category: "Signature Scripts",
  },
  greatVibes: {
    label: "Great Vibes",
    family: "Great Vibes",
    category: "Signature Scripts",
  },
  parisienne: {
    label: "Parisienne",
    family: "Parisienne",
    category: "Signature Scripts",
  },
  pinyon: {
    label: "Pinyon Script",
    family: "Pinyon Script",
    category: "Signature Scripts",
  },
  italianno: {
    label: "Italianno",
    family: "Italianno",
    category: "Signature Scripts",
  },

  dancing: {
    label: "Dancing Script",
    family: "Dancing Script",
    category: "Handwriting",
  },
  caveat: {
    label: "Caveat",
    family: "Caveat",
    category: "Handwriting",
  },
  satisfy: {
    label: "Satisfy",
    family: "Satisfy",
    category: "Handwriting",
  },
  sacramento: {
    label: "Sacramento",
    family: "Sacramento",
    category: "Handwriting",
  },
  tangerine: {
    label: "Tangerine",
    family: "Tangerine",
    category: "Handwriting",
  },
  marck: {
    label: "Marck Script",
    family: "Marck Script",
    category: "Handwriting",
  },

  petit: {
    label: "Petit Formal Script",
    family: "Petit Formal Script",
    category: "Decorative Scripts",
  },
  rouge: {
    label: "Rouge Script",
    family: "Rouge Script",
    category: "Decorative Scripts",
  },
  berkshire: {
    label: "Berkshire Swash",
    family: "Berkshire Swash",
    category: "Decorative Scripts",
  },
  yesteryear: {
    label: "Yesteryear",
    family: "Yesteryear",
    category: "Decorative Scripts",
  },

  cormorant: {
    label: "Cormorant Garamond",
    family: "Cormorant Garamond",
    category: "Professional Serif",
    style: "italic",
  },
  playfair: {
    label: "Playfair Display",
    family: "Playfair Display",
    category: "Professional Serif",
    style: "italic",
  },
  baskerville: {
    label: "Libre Baskerville",
    family: "Libre Baskerville",
    category: "Professional Serif",
    style: "italic",
  },
  lora: {
    label: "Lora",
    family: "Lora",
    category: "Professional Serif",
    style: "italic",
  },
  dmserif: {
    label: "DM Serif Display",
    family: "DM Serif Display",
    category: "Professional Serif",
    style: "italic",
  },

  montserrat: {
    label: "Montserrat",
    family: "Montserrat",
    category: "Modern Professional",
  },
  manrope: {
    label: "Manrope",
    family: "Manrope",
    category: "Modern Professional",
  },
  inter: {
    label: "Inter",
    family: "Inter",
    category: "Modern Professional",
  },
  raleway: {
    label: "Raleway",
    family: "Raleway",
    category: "Modern Professional",
  },
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
      if (existing.sheet) {
        resolve(true);
        return;
      }

      existing.addEventListener(
        "load",
        () => resolve(true),
        { once: true }
      );

      existing.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

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

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = width / height;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;

  if (imageRatio > canvasRatio) {
    sourceWidth = image.naturalHeight * canvasRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / canvasRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height
  );
}

export function SignatureGeneratorWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const draggingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const backgroundUrlRef = useRef<string | null>(null);

  const [mode, setMode] = useState<Mode>("draw");
  const [signature, setSignature] = useState("");
  const [font, setFont] = useState("greatVibes");
  const [ink, setInk] = useState("#111111");
  const [stroke, setStroke] = useState(5);
  const [fontSize, setFontSize] = useState(118);
  const [rotation, setRotation] = useState(0);

  const [position, setPosition] = useState<SignaturePosition>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
  });

  const [backgroundMode, setBackgroundMode] =
    useState<BackgroundMode>("transparent");

  const [backgroundColor, setBackgroundColor] =
    useState("#ffffff");

  const [backgroundImageUrl, setBackgroundImageUrl] =
    useState("");

  const [backgroundImageName, setBackgroundImageName] =
    useState("");

  const [format, setFormat] = useState<ExportFormat>("png");
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

  useEffect(() => {
    return () => {
      if (backgroundUrlRef.current) {
        URL.revokeObjectURL(backgroundUrlRef.current);
      }
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

    const style = selectedFont.style ?? "normal";
    const family = `"${selectedFont.family}", cursive`;

    let fitted = fontSize;

    ctx.font = `${style} ${fitted}px ${family}`;

    const maxWidth = canvas.width - 80;

    while (
      ctx.measureText(signature).width > maxWidth &&
      fitted > 24
    ) {
      fitted -= 2;
      ctx.font = `${style} ${fitted}px ${family}`;
    }

    ctx.save();

    ctx.translate(position.x, position.y);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(signature, 0, 0, maxWidth);

    ctx.restore();

    setHasInk(true);
    historyRef.current = [];
    setHistoryCount(0);
  }, [
    font,
    fontSize,
    getContext,
    ink,
    position,
    rotation,
    signature,
  ]);

  useEffect(() => {
    if (mode !== "type" || !fontsLoaded) return;

    let cancelled = false;

    const renderSignature = async () => {
      const selectedFont =
        SIGNATURE_FONTS[font] ?? SIGNATURE_FONTS.greatVibes;

      const style = selectedFont.style ?? "normal";

      try {
        await document.fonts.load(
          `${style} ${fontSize}px "${selectedFont.family}"`
        );
      } catch {
        // Use the browser fallback if the selected font is unavailable.
      }

      if (!cancelled) {
        paintTypedSignature();
      }
    };

    void renderSignature();

    return () => {
      cancelled = true;
    };
  }, [
    mode,
    font,
    fontSize,
    fontsLoaded,
    paintTypedSignature,
  ]);

  const pointFromEvent = (
    event: PointerEvent<HTMLCanvasElement>
  ): SignaturePosition => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
      };
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: Math.max(
        0,
        Math.min(
          CANVAS_WIDTH,
          ((event.clientX - rect.left) / rect.width) * canvas.width
        )
      ),
      y: Math.max(
        0,
        Math.min(
          CANVAS_HEIGHT,
          ((event.clientY - rect.top) / rect.height) * canvas.height
        )
      ),
    };
  };

  const startDrawing = (
    event: PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    const ctx = getContext();

    if (!canvas || !ctx) return;

    if (mode === "type") {
      if (!signature.trim()) return;

      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);

      draggingRef.current = true;
      setPosition(pointFromEvent(event));
      setMessage("");
      return;
    }

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
    if (mode === "type" && draggingRef.current) {
      event.preventDefault();
      setPosition(pointFromEvent(event));
      return;
    }

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
    draggingRef.current = false;
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

  const handleBackgroundUpload = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please upload a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_BACKGROUND_SIZE) {
      setMessage("Background image must be smaller than 15 MB.");
      event.target.value = "";
      return;
    }

    const newUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      if (backgroundUrlRef.current) {
        URL.revokeObjectURL(backgroundUrlRef.current);
      }

      backgroundUrlRef.current = newUrl;
      backgroundImageRef.current = image;

      setBackgroundImageUrl(newUrl);
      setBackgroundImageName(file.name);
      setBackgroundMode("image");
      setMessage("Background image loaded successfully.");
    };

    image.onerror = () => {
      URL.revokeObjectURL(newUrl);
      setMessage("Could not load this image. Please try another file.");
    };

    image.src = newUrl;
    event.target.value = "";
  };

  const removeBackgroundImage = () => {
    if (backgroundUrlRef.current) {
      URL.revokeObjectURL(backgroundUrlRef.current);
      backgroundUrlRef.current = null;
    }

    backgroundImageRef.current = null;

    setBackgroundImageUrl("");
    setBackgroundImageName("");
    setBackgroundMode("transparent");
    setMessage("Background image removed.");
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

    if (backgroundMode === "color") {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, output.width, output.height);
    } else if (
      backgroundMode === "image" &&
      backgroundImageRef.current
    ) {
      drawImageCover(
        ctx,
        backgroundImageRef.current,
        output.width,
        output.height
      );
    } else if (format === "jpg") {
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

    if (backgroundUrlRef.current) {
      URL.revokeObjectURL(backgroundUrlRef.current);
      backgroundUrlRef.current = null;
    }

    backgroundImageRef.current = null;
    historyRef.current = [];
    drawingRef.current = false;
    draggingRef.current = false;

    setMode("draw");
    setSignature("");
    setFont("greatVibes");
    setInk("#111111");
    setStroke(5);
    setFontSize(118);
    setRotation(0);
    setPosition({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
    });
    setBackgroundMode("transparent");
    setBackgroundColor("#ffffff");
    setBackgroundImageUrl("");
    setBackgroundImageName("");
    setFormat("png");
    setHasInk(false);
    setHistoryCount(0);
    setMessage("Signature settings have been reset.");
  };

  const selectedFont =
    SIGNATURE_FONTS[font] ?? SIGNATURE_FONTS.greatVibes;

  const paperStyle = {
    backgroundColor:
      backgroundMode === "color"
        ? backgroundColor
        : backgroundMode === "image"
          ? "#ffffff"
          : undefined,
    backgroundImage:
      backgroundMode === "image" && backgroundImageUrl
        ? `url("${backgroundImageUrl}")`
        : undefined,
  };

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
            Design a personal signature, position it on your own
            background, and export your finished composition.
          </p>
        </div>

        <span className="brobex-signature-private">
          <ShieldCheck size={15} />
          Private - Your files stay in your browser
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
            className={`brobex-signature-paper ${backgroundMode === "transparent"
                ? "is-transparent"
                : ""
              }`}
            style={paperStyle}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              aria-label={
                mode === "draw"
                  ? "Draw your signature here"
                  : "Drag to position your typed signature"
              }
              onPointerDown={startDrawing}
              onPointerMove={continueDrawing}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={stopDrawing}
              onLostPointerCapture={stopDrawing}
              style={{
                touchAction: "none",
                cursor: mode === "draw" ? "crosshair" : "move",
              }}
            />

            {!hasInk && mode === "draw" && (
              <span className="brobex-signature-placeholder">
                Sign here using your mouse, stylus, or finger
              </span>
            )}

            {!hasInk && mode === "type" && (
              <span className="brobex-signature-placeholder">
                Enter your name above to create your signature
              </span>
            )}
          </div>

          {mode === "type" && (
            <div className="brobex-signature-position-hint">
              <Move size={14} />
              Drag your signature directly on the canvas to position it.
            </div>
          )}

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
                : "Drag your signature to move it."}
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

          {mode === "type" && (
            <>
              <label>
                Signature size
                <output>{fontSize}px</output>
                <input
                  type="range"
                  min="30"
                  max="220"
                  value={fontSize}
                  onChange={(event) =>
                    setFontSize(Number(event.target.value))
                  }
                />
              </label>

              <label>
                Rotation
                <output>{rotation}°</output>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(event) =>
                    setRotation(Number(event.target.value))
                  }
                />
              </label>

              <button
                type="button"
                className="brobex-signature-reset-position"
                onClick={() => {
                  setPosition({
                    x: CANVAS_WIDTH / 2,
                    y: CANVAS_HEIGHT / 2,
                  });
                  setRotation(0);
                  setMessage("Signature position centered.");
                }}
              >
                <Move size={14} />
                Center signature
              </button>
            </>
          )}

          <label>
            Ink color
            <input
              type="color"
              value={ink}
              onChange={(event) => setInk(event.target.value)}
            />
          </label>

          <div className="brobex-signature-background-controls">
            <h4>Background</h4>

            <div className="brobex-signature-background-options">
              <button
                type="button"
                className={
                  backgroundMode === "transparent" ? "is-active" : ""
                }
                onClick={() => setBackgroundMode("transparent")}
              >
                Transparent
              </button>

              <button
                type="button"
                className={
                  backgroundMode === "color" ? "is-active" : ""
                }
                onClick={() => setBackgroundMode("color")}
              >
                Solid color
              </button>

              <button
                type="button"
                className={
                  backgroundMode === "image" ? "is-active" : ""
                }
                disabled={!backgroundImageUrl}
                onClick={() => setBackgroundMode("image")}
              >
                Image
              </button>
            </div>

            {backgroundMode === "color" && (
              <label>
                Background color
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(event) =>
                    setBackgroundColor(event.target.value)
                  }
                />
              </label>
            )}

            <label className="brobex-signature-upload">
              <Upload size={16} />
              <span>
                {backgroundImageUrl
                  ? "Replace background image"
                  : "Upload background image"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleBackgroundUpload}
              />
            </label>

            {backgroundImageUrl && (
              <div className="brobex-signature-image-info">
                <ImagePlus size={15} />
                <span title={backgroundImageName}>
                  {backgroundImageName}
                </span>

                <button
                  type="button"
                  onClick={removeBackgroundImage}
                  aria-label="Remove background image"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          <label>
            Download format
            <select
              value={format}
              onChange={(event) =>
                setFormat(event.target.value as ExportFormat)
              }
            >
              <option value="png">PNG - Supports transparency</option>
              <option value="jpg">JPEG - Solid background</option>
            </select>
          </label>

          <div className="brobex-signature-note">
            <strong>Export quality</strong>
            <span>
              High-resolution 1600 x 560 px image. Your selected
              background and signature are combined in the export.
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
            Your signature text, drawing, and uploaded background
            remain in your browser. Fonts are loaded from Google Fonts.
            This tool creates an image, not a verified electronic
            signature certificate.
          </p>
        </aside>
      </div>
    </section>
  );
}
