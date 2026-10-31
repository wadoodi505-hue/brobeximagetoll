
"use client";

import { useMemo, useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

import {
  faHouse, faUser, faGear, faMagnifyingGlass, faHeart,
  faStar, faBell, faCamera, faCloud, faDownload, faUpload,
  faImage, faFile, faFolder, faEnvelope, faPhone,
  faLocationDot, faCalendar, faClock, faCheck, faXmark,
  faLock, faGlobe, faRocket, faBolt, faMusic, faVideo,
  faGift, faTrash, faPen, faLink, faPlay, faSun, faMoon,
  faCircleInfo, faComment, faBookmark, faEye, faCode,
  faLaptop, faPalette, faShieldHalved, faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";

import {
  faHeart as faHeartRegular,
  faStar as faStarRegular,
  faUser as faUserRegular,
  faBell as faBellRegular,
  faBookmark as faBookmarkRegular,
  faEnvelope as faEnvelopeRegular,
  faFile as faFileRegular,
  faImage as faImageRegular,
  faClock as faClockRegular,
  faCalendar as faCalendarRegular,
  faComment as faCommentRegular,
  faEye as faEyeRegular,
  faFaceSmile,
  faCircleCheck,
} from "@fortawesome/free-regular-svg-icons";

import {
  faGithub, faInstagram, faFacebook, faYoutube,
  faWhatsapp, faXTwitter, faLinkedin, faDiscord,
  faApple, faGoogle, faMicrosoft, faTiktok,
  faSpotify, faChrome, faAmazon, faReddit,
  faPinterest, faTelegram, faSnapchat,
  faWordpress, faFigma, faAndroid,
} from "@fortawesome/free-brands-svg-icons";

type IconItem = {
  name: string;
  definition: IconDefinition;
  category: "Solid" | "Regular" | "Brands";
};

const icons: IconItem[] = [
  ...(
    [
      ["Home", faHouse], ["User", faUser], ["Settings", faGear],
      ["Search", faMagnifyingGlass], ["Heart", faHeart],
      ["Star", faStar], ["Bell", faBell], ["Camera", faCamera],
      ["Cloud", faCloud], ["Download", faDownload], ["Upload", faUpload],
      ["Image", faImage], ["File", faFile], ["Folder", faFolder],
      ["Envelope", faEnvelope], ["Phone", faPhone],
      ["Location", faLocationDot], ["Calendar", faCalendar],
      ["Clock", faClock], ["Check", faCheck], ["Close", faXmark],
      ["Lock", faLock], ["Globe", faGlobe], ["Rocket", faRocket],
      ["Bolt", faBolt], ["Music", faMusic], ["Video", faVideo],
      ["Gift", faGift], ["Trash", faTrash], ["Edit", faPen],
      ["Link", faLink], ["Play", faPlay], ["Sun", faSun],
      ["Moon", faMoon], ["Information", faCircleInfo],
      ["Comment", faComment], ["Bookmark", faBookmark],
      ["Eye", faEye], ["Code", faCode], ["Laptop", faLaptop],
      ["Palette", faPalette], ["Security", faShieldHalved],
      ["Send", faPaperPlane],
    ] as [string, IconDefinition][]
  ).map(([name, definition]) => ({
    name,
    definition,
    category: "Solid" as const,
  })),

  ...[
    ["Heart", faHeartRegular], ["Star", faStarRegular],
    ["User", faUserRegular], ["Bell", faBellRegular],
    ["Bookmark", faBookmarkRegular], ["Envelope", faEnvelopeRegular],
    ["File", faFileRegular], ["Image", faImageRegular],
    ["Clock", faClockRegular], ["Calendar", faCalendarRegular],
    ["Comment", faCommentRegular], ["Eye", faEyeRegular],
    ["Smile", faFaceSmile], ["Circle Check", faCircleCheck],
  ].map(([name, definition]) => ({
    name: name as string,
    definition: definition as IconDefinition,
    category: "Regular" as const,
  })),

  ...[
    ["GitHub", faGithub], ["Instagram", faInstagram],
    ["Facebook", faFacebook], ["YouTube", faYoutube],
    ["WhatsApp", faWhatsapp], ["X", faXTwitter],
    ["LinkedIn", faLinkedin], ["Discord", faDiscord],
    ["Apple", faApple], ["Google", faGoogle],
    ["Microsoft", faMicrosoft], ["TikTok", faTiktok],
    ["Spotify", faSpotify], ["Chrome", faChrome],
    ["Amazon", faAmazon], ["Reddit", faReddit],
    ["Pinterest", faPinterest], ["Telegram", faTelegram],
    ["Snapchat", faSnapchat], ["WordPress", faWordpress],
    ["Figma", faFigma], ["Android", faAndroid],
  ].map(([name, definition]) => ({
    name: name as string,
    definition: definition as IconDefinition,
    category: "Brands" as const,
  })),
];

function createSvg(definition: IconDefinition, color: string) {
  const [width, height, , , paths] = definition.icon;
  const pathList = Array.isArray(paths) ? paths : [paths];

  return `<svg xmlns="http://www.w3.org/2000/svg"
    width="${width}" height="${height}"
    viewBox="0 0 ${width} ${height}"
    fill="${color}" preserveAspectRatio="xMidYMid meet">
    ${pathList.map((path) => `<path fill="${color}" d="${path}"/>`).join("")}
  </svg>`;
}

export function FontAwesomeToPngWorkspace() {
  const [category, setCategory] = useState("Solid");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("Home");
  const [iconColor, setIconColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#c77b53");
  const [transparent, setTransparent] = useState(true);
  const [size, setSize] = useState(512);
  const [customSize, setCustomSize] = useState("512");
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredIcons = useMemo(() => {
    return icons.filter((item) => {
      const matchesCategory = item.category === category;
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const selectedIcon = icons.find((item) => item.name === selected && item.category === category)
    ?? icons.find((item) => item.name === selected)
    ?? icons[0];

  const svgMarkup = createSvg(selectedIcon.definition, iconColor);

  async function downloadPng() {
    if (exporting) return;

    setExporting(true);
    setError("");
    setMessage("");

    try {
      const svgBlob = new Blob([svgMarkup], {
        type: "image/svg+xml;charset=utf-8",
      });

      const svgUrl = URL.createObjectURL(svgBlob);
      const image = new Image();

      try {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Could not render this icon."));
          image.src = svgUrl;
        });

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Your browser could not create an export canvas.");
        }

        if (!transparent) {
          context.fillStyle = backgroundColor;
          context.fillRect(0, 0, size, size);
        }

        const scale = Math.min(
          (size * 0.76) / image.naturalWidth,
          (size * 0.76) / image.naturalHeight
        );

        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;

        context.drawImage(
          image,
          (size - width) / 2,
          (size - height) / 2,
          width,
          height
        );

        const png = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("PNG export failed."));
          }, "image/png");
        });

        const downloadUrl = URL.createObjectURL(png);
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = `brobex-${selectedIcon.name.toLowerCase().replace(/\s+/g, "-")}-${size}x${size}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(downloadUrl);
        canvas.width = 0;
        canvas.height = 0;

        setMessage("Your PNG icon has been exported successfully.");
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PNG export failed.");
    } finally {
      setExporting(false);
    }
  }

  function changeSize(value: number) {
    const safeValue = Math.max(16, Math.min(2048, Math.round(value)));
    setSize(safeValue);
    setCustomSize(String(safeValue));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080a0a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(183,103,60,0.13),transparent_48%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:52px_52px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <span className="text-lg font-black tracking-[0.2em]">
            BROBEX<span className="text-[#c77b53]">.</span>
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            Free · Browser processing
          </span>
        </header>

        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex rounded-full border border-[#c77b53]/25 bg-[#c77b53]/[0.08] px-3 py-1.5 text-xs text-[#e4a17d]">
            FONT AWESOME STUDIO
          </div>

          <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
            Icons made
            <span className="mt-2 block bg-gradient-to-r from-[#f0c3a7] via-[#c77b53] to-[#e6a17b] bg-clip-text text-transparent">
              export-ready.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
            Explore Font Awesome icons, customize their appearance and export crisp PNG files directly in your browser.
          </p>
        </section>

        <section className="mx-auto mt-10 grid max-w-6xl gap-5 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 rounded-3xl border border-white/10 bg-[#101313]/90 p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {["Solid", "Regular", "Brands"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setCategory(item);
                    setSearch("");
                  }}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                    category === item
                      ? "bg-[#c77b53] text-[#160d09]"
                      : "border border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search icons..."
                className="min-h-12 w-full rounded-xl border border-white/10 bg-[#090b0b] px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#c77b53]"
              />
            </div>

            <div className="mt-5 grid max-h-[510px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
              {filteredIcons.map((item) => (
                <button
                  key={`${item.category}-${item.name}`}
                  type="button"
                  onClick={() => setSelected(item.name)}
                  className={`flex min-h-24 flex-col items-center justify-center gap-3 rounded-xl border p-3 transition ${
                    selectedIcon.name === item.name
                      ? "border-[#c77b53] bg-[#c77b53]/10"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <span
                    className="text-2xl"
                    dangerouslySetInnerHTML={{
                      __html: createSvg(item.definition, "#e4a17d"),
                    }}
                  />
                  <span className="text-center text-[10px] text-white/65">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>

            {filteredIcons.length === 0 && (
              <p className="py-12 text-center text-sm text-white/40">
                No icons found. Try another search.
              </p>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-white/10 bg-[#101313]/90 p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Customize your icon</h2>
            <p className="mt-1 text-xs text-white/40">
              {selectedIcon.name} · {selectedIcon.category}
            </p>

            <div className="mt-5 flex aspect-square items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(45deg,#171a1a_25%,transparent_25%),linear-gradient(-45deg,#171a1a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#171a1a_75%),linear-gradient(-45deg,transparent_75%,#171a1a_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]">
              <div
                className="flex h-3/4 w-3/4 items-center justify-center"
                style={{
                  backgroundColor: transparent ? "transparent" : backgroundColor,
                  borderRadius: 16,
                }}
              >
                <span
                  className="w-2/3"
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs text-white/60">
                Icon color
                <span className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#090b0b] p-2">
                  <input
                    type="color"
                    value={iconColor}
                    onChange={(event) => setIconColor(event.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <span className="text-xs text-white/70">{iconColor}</span>
                </span>
              </label>

              <label className="flex items-center gap-3 text-xs text-white/65">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(event) => setTransparent(event.target.checked)}
                  className="accent-[#c77b53]"
                />
                Transparent background
              </label>

              {!transparent && (
                <label className="block text-xs text-white/60">
                  Background color
                  <span className="mt-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#090b0b] p-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <span className="text-xs text-white/70">{backgroundColor}</span>
                  </span>
                </label>
              )}

              <label className="block text-xs text-white/60">
                Export dimensions
                <select
                  value={size}
                  onChange={(event) => changeSize(Number(event.target.value))}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#090b0b] px-3 text-sm text-white outline-none focus:border-[#c77b53]"
                >
                  {[64, 128, 256, 512, 1024, 2048].map((value) => (
                    <option key={value} value={value}>
                      {value} × {value}px
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-white/60">
                Custom size (16–2048 px)
                <input
                  type="number"
                  min={16}
                  max={2048}
                  value={customSize}
                  onChange={(event) => {
                    setCustomSize(event.target.value);
                    const parsed = Number(event.target.value);
                    if (Number.isFinite(parsed) && parsed >= 16 && parsed <= 2048) {
                      setSize(Math.round(parsed));
                    }
                  }}
                  onBlur={() => changeSize(Number(customSize) || 512)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#090b0b] px-3 text-sm text-white outline-none focus:border-[#c77b53]"
                />
              </label>

              <button
                type="button"
                onClick={downloadPng}
                disabled={exporting}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c77b53] px-4 py-3 text-sm font-semibold text-[#160d09] transition hover:bg-[#dfa17e] disabled:opacity-60"
              >
                {exporting ? "Exporting..." : `Download PNG · ${size}px`}
              </button>

              {error && (
                <p role="alert" className="text-xs leading-5 text-red-300">{error}</p>
              )}
              {message && (
                <p role="status" className="text-xs leading-5 text-emerald-300">{message}</p>
              )}
            </div>
          </aside>
        </section>

        <footer className="mt-12 text-center text-xs text-white/30">
          BROBEX Image Tools · Font Awesome to PNG
        </footer>
      </div>
    </main>
  );
}
