
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

  // Navigation and actions
  faBars, faArrowRight, faArrowLeft, faArrowUp, faArrowDown,
  faPlus, faMinus, faFilter, faSliders, faSort,
  faEllipsis, faEllipsisVertical, faShareNodes, faCopy,
  faPrint, faFloppyDisk, faRotate, faRotateLeft, faRotateRight,
  faArrowsRotate, faExpand, faCompress, faExternalLink,

  // Development and technology
  faDatabase, faServer, faTerminal, faDesktop,
  faMobileScreenButton, faTabletScreenButton, faKeyboard,
  faMouse, faWifi, faMicrochip, faMemory,
  faHardDrive, faGauge, faChartLine, faChartBar,
  faChartPie, faChartArea, faDiagramProject, faBrain,
  faRobot, faWandMagicSparkles, faCodeBranch, faBug,
  faSitemap, faNetworkWired, faLaptopCode,

  // Design and image editing
  faPenToSquare, faScissors, faCrop, faLayerGroup,
  faShapes, faCube, faCubes, faBrush, faDroplet,
  faSwatchbook, faFillDrip, faEraser, faRuler,
  faRulerCombined, faLightbulb, faObjectUngroup, faBorderAll,

  // Files and documents
  faFilePdf, faFileCode, faFileImage, faFileVideo,
  faFileAudio, faFileLines, faFileExcel, faFileWord,
  faFilePowerpoint, faFileArchive, faFileZipper,
  faFileArrowDown, faFileArrowUp, faFolderOpen,
  faFolderPlus, faFolderMinus, faClipboard,
  faClipboardCheck, faPaste, faList, faListCheck,
  faTable, faBook, faBookOpen,

  // Business and finance
  faBriefcase, faBuilding, faUsers, faUserGroup,
  faUserPlus, faUserMinus, faUserShield, faIdCard,
  faAddressCard, faWallet, faCreditCard, faMoneyBill,
  faCoins, faReceipt, faCartShopping, faBasketShopping,
  faStore, faTag, faTags, faPercent, faCalculator,
  faChartSimple, faBullseye, faHandshake, faAward,

  // Security and status
  faKey, faFingerprint, faShield, faLockOpen,
  faUnlock, faEyeSlash, faCircleExclamation,
  faTriangleExclamation, faCircleQuestion, faCircleXmark,
  faCirclePlus, faCircleMinus, faCheckDouble,
  faShieldVirus, faUserLock, faUserCheck,

  // Communication and media
  faHeadphones, faMicrophone, faPodcast, faRadio,
  faVolumeHigh, faVolumeLow, faVolumeMute,
  faPause, faStop, faForward, faBackward,
  faRepeat, faCommentDots, faComments,
  faMessage , faAt, faHashtag,

  // Travel and location
  faMap, faMapPin, faMapLocationDot, faRoute,
  faCompass, faFlag, faPlane, faCar, faTrain,
  faBus, faBicycle, faShip, faTruck,

  // Lifestyle and miscellaneous
  faFire, faLeaf, faTree, faWater, faSnowflake,
  faUmbrella, faCloudArrowUp, faCloudArrowDown,
  faTrophy, faMedal, faCrown, faGamepad,
  faDumbbell, faPersonRunning, faPersonWalking,
  faStethoscope, faClockRotateLeft, faPowerOff,
  faCirclePlay, faCirclePause, faCircleStop,
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
  faApple, faGoogle , faTiktok,
  faSpotify, faChrome, faAmazon, faReddit,
  faPinterest, faTelegram, faSnapchat,
  faWordpress, faFigma, faAndroid,

  // Developer platforms
  faGitlab, faBitbucket, faStackOverflow,
  faCodepen, faBehance, faDribbble,
  faNpm, faNodeJs, faReact, faVuejs,
  faAngular, faHtml5, faCss3Alt, faJs,
  faPython, faJava, faPhp, faLaravel,
  faSass, faBootstrap, faDocker, faLinux,

  // Social and creator platforms
  faThreads, faTumblr, faVimeo, faTwitch,
  faSteam, faSoundcloud, faDeviantart,
  faMastodon, faMedium, faDev,

  // Business and cloud platforms
  faDropbox, faGoogleDrive, faGooglePlay,
  faPaypal, faStripe, faShopify,
  faWix, faSquarespace, faSlack,
  faAtlassian, faJira, faTrello,
  faSalesforce, faAws, faMicrosoft,

} from "@fortawesome/free-brands-svg-icons";


type IconCategory = "Solid" | "Regular" | "Brands";

type IconItem = {
  name: string;
  definition: IconDefinition;
  category: IconCategory;
};



const PRESET_SIZES = [64, 128, 256, 512, 1024, 2048];


const icons: IconItem[] = [
  ...(
    [
      // Original icons
      ["Home", faHouse],
      ["User", faUser],
      ["Settings", faGear],
      ["Search", faMagnifyingGlass],
      ["Heart", faHeart],
      ["Star", faStar],
      ["Bell", faBell],
      ["Camera", faCamera],
      ["Cloud", faCloud],
      ["Download", faDownload],
      ["Upload", faUpload],
      ["Image", faImage],
      ["File", faFile],
      ["Folder", faFolder],
      ["Envelope", faEnvelope],
      ["Phone", faPhone],
      ["Location", faLocationDot],
      ["Calendar", faCalendar],
      ["Clock", faClock],
      ["Check", faCheck],
      ["Close", faXmark],
      ["Lock", faLock],
      ["Globe", faGlobe],
      ["Rocket", faRocket],
      ["Bolt", faBolt],
      ["Music", faMusic],
      ["Video", faVideo],
      ["Gift", faGift],
      ["Trash", faTrash],
      ["Edit", faPen],
      ["Link", faLink],
      ["Play", faPlay],
      ["Sun", faSun],
      ["Moon", faMoon],
      ["Information", faCircleInfo],
      ["Comment", faComment],
      ["Bookmark", faBookmark],
      ["Eye", faEye],
      ["Code", faCode],
      ["Laptop", faLaptop],
      ["Palette", faPalette],
      ["Security", faShieldHalved],
      ["Send", faPaperPlane],

      // Navigation and actions
      ["Menu", faBars],
      ["Arrow Right", faArrowRight],
      ["Arrow Left", faArrowLeft],
      ["Arrow Up", faArrowUp],
      ["Arrow Down", faArrowDown],
      ["Plus", faPlus],
      ["Minus", faMinus],
      ["Filter", faFilter],
      ["Sliders", faSliders],
      ["Sort", faSort],
      ["More", faEllipsis],
      ["More Vertical", faEllipsisVertical],
      ["Share", faShareNodes],
      ["Copy", faCopy],
      ["Print", faPrint],
      ["Save", faFloppyDisk],
      ["Rotate", faRotate],
      ["Rotate Left", faRotateLeft],
      ["Rotate Right", faRotateRight],
      ["Refresh", faArrowsRotate],
      ["Expand", faExpand],
      ["Compress", faCompress],
      ["External Link", faExternalLink],

      // Technology and development
      ["Database", faDatabase],
      ["Server", faServer],
      ["Terminal", faTerminal],
      ["Desktop", faDesktop],
      ["Mobile", faMobileScreenButton],
      ["Tablet", faTabletScreenButton],
      ["Keyboard", faKeyboard],
      ["Mouse", faMouse],
      ["WiFi", faWifi],
      ["Microchip", faMicrochip],
      ["Memory", faMemory],
      ["Hard Drive", faHardDrive],
      ["Gauge", faGauge],
      ["Chart Line", faChartLine],
      ["Chart Bar", faChartBar],
      ["Chart Pie", faChartPie],
      ["Chart Area", faChartArea],
      ["Project Diagram", faDiagramProject],
      ["Brain", faBrain],
      ["Robot", faRobot],
      ["AI Magic", faWandMagicSparkles],
      ["Code Branch", faCodeBranch],
      ["Bug", faBug],
      ["Sitemap", faSitemap],
      ["Network", faNetworkWired],
      ["Laptop Code", faLaptopCode],

      // Graphics and design
      ["Edit Square", faPenToSquare],
      ["Scissors", faScissors],
      ["Crop", faCrop],
      ["Layers", faLayerGroup],
      ["Shapes", faShapes],
      ["Cube", faCube],
      ["Cubes", faCubes],
      ["Brush", faBrush],
      ["Droplet", faDroplet],
      ["Swatches", faSwatchbook],
      ["Fill", faFillDrip],
      ["Eraser", faEraser],
      ["Ruler", faRuler],
      ["Ruler Combined", faRulerCombined],
      ["Lightbulb", faLightbulb],
      ["Object Ungroup", faObjectUngroup],
      ["Border", faBorderAll],

      // Files and documents
      ["PDF", faFilePdf],
      ["Code File", faFileCode],
      ["Image File", faFileImage],
      ["Video File", faFileVideo],
      ["Audio File", faFileAudio],
      ["Text File", faFileLines],
      ["Excel File", faFileExcel],
      ["Word File", faFileWord],
      ["PowerPoint File", faFilePowerpoint],
      ["Archive", faFileArchive],
      ["ZIP File", faFileZipper],
      ["Download File", faFileArrowDown],
      ["Upload File", faFileArrowUp],
      ["Open Folder", faFolderOpen],
      ["New Folder", faFolderPlus],
      ["Remove Folder", faFolderMinus],
      ["Clipboard", faClipboard],
      ["Clipboard Check", faClipboardCheck],
      ["Paste", faPaste],
      ["List", faList],
      ["Checklist", faListCheck],
      ["Table", faTable],
      ["Book", faBook],
      ["Open Book", faBookOpen],

      // Business and finance
      ["Briefcase", faBriefcase],
      ["Building", faBuilding],
      ["Users", faUsers],
      ["User Group", faUserGroup],
      ["Add User", faUserPlus],
      ["Remove User", faUserMinus],
      ["Protected User", faUserShield],
      ["ID Card", faIdCard],
      ["Address Card", faAddressCard],
      ["Wallet", faWallet],
      ["Credit Card", faCreditCard],
      ["Money", faMoneyBill],
      ["Coins", faCoins],
      ["Receipt", faReceipt],
      ["Shopping Cart", faCartShopping],
      ["Shopping Basket", faBasketShopping],
      ["Store", faStore],
      ["Tag", faTag],
      ["Tags", faTags],
      ["Percentage", faPercent],
      ["Calculator", faCalculator],
      ["Simple Chart", faChartSimple],
      ["Target", faBullseye],
      ["Handshake", faHandshake],
      ["Award", faAward],

      // Security and alerts
      ["Key", faKey],
      ["Fingerprint", faFingerprint],
      ["Shield", faShield],
      ["Unlock", faUnlock],
      ["Open Lock", faLockOpen],
      ["Hidden Eye", faEyeSlash],
      ["Warning Circle", faCircleExclamation],
      ["Warning", faTriangleExclamation],
      ["Question", faCircleQuestion],
      ["Error Circle", faCircleXmark],
      ["Add Circle", faCirclePlus],
      ["Remove Circle", faCircleMinus],
      ["Double Check", faCheckDouble],
      ["Virus Protection", faShieldVirus],
      ["User Lock", faUserLock],
      ["Verified User", faUserCheck],

      // Audio and communication
      ["Headphones", faHeadphones],
      ["Microphone", faMicrophone],
      ["Podcast", faPodcast],
      ["Radio", faRadio],
      ["Volume High", faVolumeHigh],
      ["Volume Low", faVolumeLow],
      ["Mute", faVolumeMute],
      ["Pause", faPause],
      ["Stop", faStop],
      ["Forward", faForward],
      ["Backward", faBackward],
      ["Repeat", faRepeat],
      ["Comment Dots", faCommentDots],
      ["Comments", faComments],
      ["Message", faMessage],
      ["At Symbol", faAt],
      ["Hashtag", faHashtag],

      // Travel and maps
      ["Map", faMap],
      ["Map Pin", faMapPin],
      ["Map Location", faMapLocationDot],
      ["Route", faRoute],
      ["Compass", faCompass],
      ["Flag", faFlag],
      ["Airplane", faPlane],
      ["Car", faCar],
      ["Train", faTrain],
      ["Bus", faBus],
      ["Bicycle", faBicycle],
      ["Ship", faShip],
      ["Truck", faTruck],

      // Nature and lifestyle
      ["Fire", faFire],
      ["Leaf", faLeaf],
      ["Tree", faTree],
      ["Water", faWater],
      ["Snowflake", faSnowflake],
      ["Umbrella", faUmbrella],
      ["Cloud Upload", faCloudArrowUp],
      ["Cloud Download", faCloudArrowDown],
      ["Trophy", faTrophy],
      ["Medal", faMedal],
      ["Crown", faCrown],
      ["Gaming", faGamepad],
      ["Fitness", faDumbbell],
      ["Running", faPersonRunning],
      ["Walking", faPersonWalking],
      ["Medical", faStethoscope],
      ["History", faClockRotateLeft],
      ["Power", faPowerOff],
      ["Circle Play", faCirclePlay],
      ["Circle Pause", faCirclePause],
      ["Circle Stop", faCircleStop],
    ] as [string, IconDefinition][]
  ).map(([name, definition]) => ({
    name,
    definition,
    category: "Solid" as const,
  })),

  ...(
    [
      ["Heart", faHeartRegular],
      ["Star", faStarRegular],
      ["User", faUserRegular],
      ["Bell", faBellRegular],
      ["Bookmark", faBookmarkRegular],
      ["Envelope", faEnvelopeRegular],
      ["File", faFileRegular],
      ["Image", faImageRegular],
      ["Clock", faClockRegular],
      ["Calendar", faCalendarRegular],
      ["Comment", faCommentRegular],
      ["Eye", faEyeRegular],
      ["Smile", faFaceSmile],
      ["Circle Check", faCircleCheck],
    ] as [string, IconDefinition][]
  ).map(([name, definition]) => ({
    name,
    definition,
    category: "Regular" as const,
  })),

  ...(
    [
      ["GitHub", faGithub],
      ["Instagram", faInstagram],
      ["Facebook", faFacebook],
      ["YouTube", faYoutube],
      ["WhatsApp", faWhatsapp],
      ["X", faXTwitter],
      ["LinkedIn", faLinkedin],
      ["Discord", faDiscord],
      ["Apple", faApple],
      ["Google", faGoogle],
      ["Microsoft", faMicrosoft],
      ["TikTok", faTiktok],
      ["Spotify", faSpotify],
      ["Chrome", faChrome],
      ["Amazon", faAmazon],
      ["Reddit", faReddit],
      ["Pinterest", faPinterest],
      ["Telegram", faTelegram],
      ["Snapchat", faSnapchat],
      ["WordPress", faWordpress],
      ["Figma", faFigma],
      ["Android", faAndroid],

      // Developer platforms
      ["GitLab", faGitlab],
      ["Bitbucket", faBitbucket],
      ["Stack Overflow", faStackOverflow],
      ["CodePen", faCodepen],
      ["Behance", faBehance],
      ["Dribbble", faDribbble],
      ["NPM", faNpm],
      ["Node.js", faNodeJs],
      ["React", faReact],
      ["Vue.js", faVuejs],
      ["Angular", faAngular],
      ["HTML5", faHtml5],
      ["CSS3", faCss3Alt],
      ["JavaScript", faJs],
      ["Python", faPython],
      ["Java", faJava],
      ["PHP", faPhp],
      ["Laravel", faLaravel],
      ["Sass", faSass],
      ["Bootstrap", faBootstrap],
      ["Docker", faDocker],
      ["Linux", faLinux],

      // Social and creator platforms
      ["Threads", faThreads],
      ["Tumblr", faTumblr],
      ["Vimeo", faVimeo],
      ["Twitch", faTwitch],
      ["Steam", faSteam],
      ["SoundCloud", faSoundcloud],
      ["DeviantArt", faDeviantart],
      ["Mastodon", faMastodon],
      ["Medium", faMedium],
      ["DEV Community", faDev],

      // Business and cloud platforms
      ["Dropbox", faDropbox],
      ["Google Drive", faGoogleDrive],
      ["Google Play", faGooglePlay],
      ["PayPal", faPaypal],
      ["Stripe", faStripe],
      ["Shopify", faShopify],
      ["Wix", faWix],
      ["Squarespace", faSquarespace],
      ["Slack", faSlack],
      ["Atlassian", faAtlassian],
      ["Jira", faJira],
      ["Trello", faTrello],
      ["Salesforce", faSalesforce],
      ["Amazon AWS", faAws],
    ] as [string, IconDefinition][]
  ).map(([name, definition]) => ({
    name,
    definition,
    category: "Brands" as const,
  })),
];


function createSvg(definition: IconDefinition, color: string) {
  const [width, height, , , paths] = definition.icon;
  const pathList = Array.isArray(paths) ? paths : [paths];

  return `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="${width}"
            height="${height}"
            viewBox="0 0 ${width} ${height}"
            fill="${color}"
            preserveAspectRatio="xMidYMid meet"
            style="display:block;max-width:100%;max-height:100%;width:100%;height:100%;"
        >
            ${pathList.map((path) => `<path fill="${color}" d="${path}"/>`).join("")}
        </svg>
    `;
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function FontAwesomeToPngWorkspace() {
  const [category, setCategory] = useState<IconCategory>("Solid");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("Home");

  const [iconColor, setIconColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("#C77B53");
  const [transparent, setTransparent] = useState(true);

  const [size, setSize] = useState(512);
  const [customSize, setCustomSize] = useState("512");

  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredIcons = useMemo(() => {
    const query = search.trim().toLowerCase();

    return icons.filter((item) => {
      return (
        item.category === category &&
        item.name.toLowerCase().includes(query)
      );
    });
  }, [category, search]);

  const selectedIcon = useMemo(() => {
    return (
      icons.find(
        (item) =>
          item.name === selected &&
          item.category === category
      ) ??
      icons.find((item) => item.name === selected) ??
      icons[0]
    );
  }, [selected, category]);

  const svgMarkup = useMemo(
    () => createSvg(selectedIcon.definition, iconColor),
    [selectedIcon, iconColor]
  );

  function selectCategory(value: IconCategory) {
    setCategory(value);
    setSearch("");

    const firstIcon = icons.find(
      (item) => item.category === value
    );

    if (firstIcon) {
      setSelected(firstIcon.name);
    }

    setMessage("");
    setError("");
  }

  function changeSize(value: number) {
    const safeValue = Math.max(
      16,
      Math.min(2048, Math.round(value))
    );

    setSize(safeValue);
    setCustomSize(String(safeValue));
    setError("");
  }

  async function downloadPng() {
    if (exporting) return;

    setExporting(true);
    setError("");
    setMessage("");

    let svgUrl = "";

    try {
      const svgBlob = new Blob([svgMarkup], {
        type: "image/svg+xml;charset=utf-8",
      });

      svgUrl = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.decoding = "async";

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("Could not render this icon."));

        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error(
          "Your browser could not create an export canvas."
        );
      }

      if (!transparent) {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, size, size);
      }

      const naturalWidth = image.naturalWidth || 1;
      const naturalHeight = image.naturalHeight || 1;

      const scale = Math.min(
        (size * 0.76) / naturalWidth,
        (size * 0.76) / naturalHeight
      );

      const width = naturalWidth * scale;
      const height = naturalHeight * scale;

      context.drawImage(
        image,
        (size - width) / 2,
        (size - height) / 2,
        width,
        height
      );

      const pngBlob = await new Promise<Blob>(
        (resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("PNG export failed."));
            },
            "image/png"
          );
        }
      );

      const filename = `brobex-${safeFilename(
        selectedIcon.name
      )}-${size}x${size}.png`;

      downloadBlob(pngBlob, filename);

      canvas.width = 0;
      canvas.height = 0;

      setMessage("Your PNG has been exported successfully.");
    } catch (cause) {
      console.error("Font Awesome PNG export failed:", cause);

      setError(
        cause instanceof Error
          ? cause.message
          : "PNG export failed. Please try again."
      );
    } finally {
      if (svgUrl) {
        URL.revokeObjectURL(svgUrl);
      }

      setExporting(false);
    }
  }

  const panelClass =
    "min-w-0 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#101313]/95 p-4 sm:p-6";

  const fieldClass =
    "min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#090B0B] px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#C77B53]";

  return (
    <main className="relative isolate min-h-screen w-full overflow-x-clip bg-[#080A0A] text-white">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(183,103,60,0.13),transparent_48%)]" />

      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:52px_52px]" />

      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-14">

        {/* Header */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 sm:mb-14">

          <span className="text-lg font-black tracking-[0.2em] sm:text-xl">
            BROBEX<span className="text-[#C77B53]">.</span>
          </span>

          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-white/65 sm:text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            Free · Browser processing
          </span>

        </header>

        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">

          <div className="mb-5 inline-flex max-w-full rounded-full border border-[#C77B53]/25 bg-[#C77B53]/[0.08] px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#E4A17D] sm:text-xs">
            FONT AWESOME STUDIO
          </div>

          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl md:text-6xl">
            Icons made
            <span className="mt-1 block bg-gradient-to-r from-[#F0C3A7] via-[#C77B53] to-[#E6A17B] bg-clip-text text-transparent sm:mt-2">
              export-ready.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55 sm:mt-5 sm:text-base sm:leading-7">
            Explore Font Awesome icons, customize their appearance and export crisp PNG files directly in your browser.
          </p>

        </section>

        {/* Main workspace */}
        <section className="mx-auto mt-8 grid w-full max-w-6xl min-w-0 grid-cols-1 items-start gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">

          {/* Icon library */}
          <div className={`${panelClass} w-full`}>

            {/* Categories */}
            <div className="grid grid-cols-3 gap-2">

              {(["Solid", "Regular", "Brands"] as const).map((item) => {
                const active = category === item;

                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectCategory(item)}
                    className={`min-h-10 rounded-xl border px-2 py-2.5 text-xs font-semibold transition sm:min-h-11 sm:px-4 ${active
                        ? "border-[#C77B53] bg-[#C77B53] text-[#160D09]"
                        : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
                      }`}
                  >
                    {item}
                  </button>
                );
              })}

            </div>

            {/* Search */}
            <div className="mt-4 sm:mt-5">

              <label
                htmlFor="font-awesome-search"
                className="mb-2 block text-xs font-medium text-white/55"
              >
                Search icon library
              </label>

              <input
                id="font-awesome-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search icons..."
                autoComplete="off"
                className={fieldClass}
              />

            </div>

            {/* Results count */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">

              <p className="text-xs font-medium text-white/60">
                {category} icons
              </p>

              <span className="text-[10px] text-white/35">
                {filteredIcons.length} available
              </span>

            </div>

            {/* Icon grid */}
            <div className="mt-3 grid max-h-[440px] grid-cols-3 gap-2 overflow-x-hidden overflow-y-auto overscroll-contain pr-1 sm:max-h-[540px] sm:grid-cols-4 sm:gap-3 md:grid-cols-5">

              {filteredIcons.map((item) => {
                const active =
                  selectedIcon.name === item.name &&
                  selectedIcon.category === item.category;

                return (
                  <button
                    key={`${item.category}-${item.name}`}
                    type="button"
                    aria-label={`Select ${item.name} icon`}
                    aria-pressed={active}
                    onClick={() => {
                      setSelected(item.name);
                      setMessage("");
                      setError("");
                    }}
                    className={`group flex min-w-0 min-h-[92px] flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border p-2 transition sm:min-h-[108px] sm:gap-3 sm:p-3 ${active
                        ? "border-[#C77B53] bg-[#C77B53]/10 shadow-[0_0_20px_rgba(199,123,83,0.08)]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 max-w-full shrink-0 items-center justify-center text-[#E4A17D] transition group-hover:scale-110 sm:h-8 sm:w-8 [&>svg]:h-full [&>svg]:w-full"
                      dangerouslySetInnerHTML={{
                        __html: createSvg(
                          item.definition,
                          active ? "#F0C3A7" : "#E4A17D"
                        ),
                      }}
                    />

                    <span className="w-full truncate text-center text-[10px] font-medium text-white/65 sm:text-xs">
                      {item.name}
                    </span>

                  </button>
                );
              })}

            </div>

            {/* Empty state */}
            {filteredIcons.length === 0 && (
              <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">

                <p className="text-sm font-semibold text-white/75">
                  No icons found
                </p>

                <p className="mt-2 text-xs leading-5 text-white/40">
                  Try another search term or select a different category.
                </p>

                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-xs text-[#E4A17D] transition hover:bg-white/[0.05]"
                >
                  Clear search
                </button>

              </div>
            )}

          </div>

          {/* Customization panel */}
          <aside className={`${panelClass} w-full lg:sticky lg:top-6`}>

            <div className="flex min-w-0 items-start justify-between gap-3">

              <div className="min-w-0">
                <h2 className="text-sm font-semibold sm:text-base">
                  Customize your icon
                </h2>

                <p className="mt-1 truncate text-xs text-white/40">
                  {selectedIcon.name} · {selectedIcon.category}
                </p>
              </div>

              <span className="shrink-0 rounded-lg border border-[#C77B53]/20 bg-[#C77B53]/10 px-2 py-1 text-[9px] font-semibold text-[#E4A17D]">
                PNG
              </span>

            </div>

            {/* Preview */}
            <div className="mt-5 flex aspect-square w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(45deg,#171a1a_25%,transparent_25%),linear-gradient(-45deg,#171a1a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#171a1a_75%),linear-gradient(-45deg,transparent_75%,#171a1a_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-5 sm:p-7">

              <div
                className="flex h-full w-full max-h-64 max-w-64 items-center justify-center overflow-hidden rounded-2xl p-5 sm:p-7"
                style={{
                  backgroundColor: transparent
                    ? "transparent"
                    : backgroundColor,
                }}
              >

                <span
                  aria-label={`${selectedIcon.name} icon preview`}
                  role="img"
                  className="flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{
                    __html: svgMarkup,
                  }}
                />

              </div>

            </div>

            {/* Controls */}
            <div className="mt-5 space-y-4">

              {/* Icon color */}
              <label className="block min-w-0 text-xs text-white/60">

                Icon color

                <span className="mt-2 flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#090B0B] p-2">

                  <input
                    type="color"
                    value={iconColor}
                    onChange={(event) => setIconColor(event.target.value)}
                    aria-label="Choose icon color"
                    className="h-9 w-12 shrink-0 cursor-pointer rounded border-0 bg-transparent"
                  />

                  <span className="truncate text-xs text-white/70">
                    {iconColor.toUpperCase()}
                  </span>

                </span>

              </label>

              {/* Transparency */}
              <label className="flex min-h-9 cursor-pointer items-center gap-3 text-xs text-white/65">

                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(event) => setTransparent(event.target.checked)}
                  className="h-4 w-4 shrink-0 accent-[#C77B53]"
                />

                Transparent background

              </label>

              {/* Background color */}
              {!transparent && (
                <label className="block min-w-0 text-xs text-white/60">

                  Background color

                  <span className="mt-2 flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#090B0B] p-2">

                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                      aria-label="Choose background color"
                      className="h-9 w-12 shrink-0 cursor-pointer rounded border-0 bg-transparent"
                    />

                    <span className="truncate text-xs text-white/70">
                      {backgroundColor.toUpperCase()}
                    </span>

                  </span>

                </label>
              )}

              {/* Preset size */}
              <label className="block text-xs text-white/60">

                Export dimensions

                <select
                  value={
                    PRESET_SIZES.includes(size)
                      ? String(size)
                      : "custom"
                  }
                  onChange={(event) => {
                    if (event.target.value === "custom") return;
                    changeSize(Number(event.target.value));
                  }}
                  className={`${fieldClass} mt-2`}
                >
                  {PRESET_SIZES.map((value) => (
                    <option key={value} value={value}>
                      {value} × {value}px
                    </option>
                  ))}

                  {!PRESET_SIZES.includes(size) && (
                    <option value="custom">
                      Custom · {size}px
                    </option>
                  )}

                </select>

              </label>

              {/* Custom size */}
              <label className="block text-xs text-white/60">

                Custom size (16–2048 px)

                <input
                  type="number"
                  min={16}
                  max={2048}
                  step={1}
                  inputMode="numeric"
                  value={customSize}
                  onChange={(event) => {
                    const value = event.target.value;

                    setCustomSize(value);

                    if (value.trim() === "") return;

                    const parsed = Number(value);

                    if (
                      Number.isInteger(parsed) &&
                      parsed >= 16 &&
                      parsed <= 2048
                    ) {
                      setSize(parsed);
                    }
                  }}
                  onBlur={() => {
                    const parsed = Number(customSize);

                    changeSize(
                      Number.isFinite(parsed)
                        ? parsed
                        : 512
                    );
                  }}
                  className={`${fieldClass} mt-2`}
                />

              </label>

              {/* Download */}
              <button
                type="button"
                onClick={downloadPng}
                disabled={exporting}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C77B53] px-4 py-3 text-sm font-semibold text-[#160D09] transition hover:bg-[#DFA17E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#160D09]/30 border-t-[#160D09]" />
                    Preparing PNG...
                  </>
                ) : (
                  `Download PNG · ${size}px`
                )}
              </button>

              {/* Messages */}
              {error && (
                <p
                  role="alert"
                  className="break-words rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-xs leading-5 text-red-300"
                >
                  {error}
                </p>
              )}

              {message && (
                <p
                  role="status"
                  aria-live="polite"
                  className="break-words rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-xs leading-5 text-emerald-300"
                >
                  {message}
                </p>
              )}

            </div>

          </aside>

        </section>

        {/* Footer */}
        <footer className="mx-auto mt-10 max-w-6xl border-t border-white/[0.07] pt-6 text-center sm:mt-14">

          <p className="text-[11px] leading-6 text-white/35 sm:text-xs">
            BROBEX Image Tools · Font Awesome to PNG
          </p>

          <p className="mt-1 text-[10px] text-white/25">
            Customize and export icons directly in your browser.
          </p>

        </footer>

      </div>
    </main>
  );
}
