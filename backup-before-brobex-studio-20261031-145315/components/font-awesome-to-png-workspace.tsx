
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
  faBars, faArrowRight, faArrowLeft, faArrowUp, faArrowDown,
  faPlus, faMinus, faFilter, faSliders, faSort,
  faEllipsis, faEllipsisVertical, faShareNodes, faCopy,
  faPrint, faFloppyDisk, faRotate, faRotateLeft, faRotateRight,
  faArrowsRotate, faExpand, faCompress, faExternalLink,
  faDatabase, faServer, faTerminal, faDesktop,
  faMobileScreenButton, faTabletScreenButton, faKeyboard,
  faMouse, faWifi, faMicrochip, faMemory,
  faHardDrive, faGauge, faChartLine, faChartBar,
  faChartPie, faChartArea, faDiagramProject, faBrain,
  faRobot, faWandMagicSparkles, faCodeBranch, faBug,
  faSitemap, faNetworkWired, faLaptopCode,
  faPenToSquare, faScissors, faCrop, faLayerGroup,
  faShapes, faCube, faCubes, faBrush, faDroplet,
  faSwatchbook, faFillDrip, faEraser, faRuler,
  faRulerCombined, faLightbulb, faObjectUngroup, faBorderAll,
  faFilePdf, faFileCode, faFileImage, faFileVideo,
  faFileAudio, faFileLines, faFileExcel, faFileWord,
  faFilePowerpoint, faFileArchive, faFileZipper,
  faFileArrowDown, faFileArrowUp, faFolderOpen,
  faFolderPlus, faFolderMinus, faClipboard,
  faClipboardCheck, faPaste, faList, faListCheck,
  faTable, faBook, faBookOpen,
  faBriefcase, faBuilding, faUsers, faUserGroup,
  faUserPlus, faUserMinus, faUserShield, faIdCard,
  faAddressCard, faWallet, faCreditCard, faMoneyBill,
  faCoins, faReceipt, faCartShopping, faBasketShopping,
  faStore, faTag, faTags, faPercent, faCalculator,
  faChartSimple, faBullseye, faHandshake, faAward,
  faKey, faFingerprint, faShield, faLockOpen,
  faUnlock, faEyeSlash, faCircleExclamation,
  faTriangleExclamation, faCircleQuestion, faCircleXmark,
  faCirclePlus, faCircleMinus, faCheckDouble,
  faShieldVirus, faUserLock, faUserCheck,
  faHeadphones, faMicrophone, faPodcast, faRadio,
  faVolumeHigh, faVolumeLow, faVolumeMute,
  faPause, faStop, faForward, faBackward,
  faRepeat, faCommentDots, faComments, faMessage,
  faAt, faHashtag,
  faMap, faMapPin, faMapLocationDot, faRoute,
  faCompass, faFlag, faPlane, faCar, faTrain,
  faBus, faBicycle, faShip, faTruck,
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
  faApple, faGoogle, faTiktok,
  faSpotify, faChrome, faAmazon, faReddit,
  faPinterest, faTelegram, faSnapchat,
  faWordpress, faFigma, faAndroid,
  faGitlab, faBitbucket, faStackOverflow,
  faCodepen, faBehance, faDribbble,
  faNpm, faNodeJs, faReact, faVuejs,
  faAngular, faHtml5, faCss3Alt, faJs,
  faPython, faJava, faPhp, faLaravel,
  faSass, faBootstrap, faDocker, faLinux,
  faThreads, faTumblr, faVimeo, faTwitch,
  faSteam, faSoundcloud, faDeviantart,
  faMastodon, faMedium, faDev,
  faDropbox, faGoogleDrive, faGooglePlay,
  faPaypal, faStripe, faShopify,
  faWix, faSquarespace, faSlack,
  faAtlassian, faJira, faTrello,
  faSalesforce, faAws, faMicrosoft,
} from "@fortawesome/free-brands-svg-icons";

type IconCategory = "Solid" | "Regular" | "Brands";
type StudioTab = "icons" | "emojis";
type ExportFormat = "PNG" | "JPG" | "JPEG" | "WebP" | "SVG" | "ICO";

type IconItem = {
  name: string;
  definition: IconDefinition;
  category: IconCategory;
};

type EmojiItem = {
  emoji: string;
  name: string;
  category: string;
};

const PRESET_SIZES = [64, 128, 256, 512, 1024, 2048];

const solidIcons: [string, IconDefinition][] = [
  ["Home", faHouse], ["User", faUser], ["Settings", faGear],
  ["Search", faMagnifyingGlass], ["Heart", faHeart], ["Star", faStar],
  ["Bell", faBell], ["Camera", faCamera], ["Cloud", faCloud],
  ["Download", faDownload], ["Upload", faUpload], ["Image", faImage],
  ["File", faFile], ["Folder", faFolder], ["Envelope", faEnvelope],
  ["Phone", faPhone], ["Location", faLocationDot],
  ["Calendar", faCalendar], ["Clock", faClock], ["Check", faCheck],
  ["Close", faXmark], ["Lock", faLock], ["Globe", faGlobe],
  ["Rocket", faRocket], ["Bolt", faBolt], ["Music", faMusic],
  ["Video", faVideo], ["Gift", faGift], ["Trash", faTrash],
  ["Edit", faPen], ["Link", faLink], ["Play", faPlay],
  ["Sun", faSun], ["Moon", faMoon], ["Information", faCircleInfo],
  ["Comment", faComment], ["Bookmark", faBookmark], ["Eye", faEye],
  ["Code", faCode], ["Laptop", faLaptop], ["Palette", faPalette],
  ["Security", faShieldHalved], ["Send", faPaperPlane],

  ["Menu", faBars], ["Arrow Right", faArrowRight],
  ["Arrow Left", faArrowLeft], ["Arrow Up", faArrowUp],
  ["Arrow Down", faArrowDown], ["Plus", faPlus], ["Minus", faMinus],
  ["Filter", faFilter], ["Sliders", faSliders], ["Sort", faSort],
  ["More", faEllipsis], ["More Vertical", faEllipsisVertical],
  ["Share", faShareNodes], ["Copy", faCopy], ["Print", faPrint],
  ["Save", faFloppyDisk], ["Rotate", faRotate],
  ["Rotate Left", faRotateLeft], ["Rotate Right", faRotateRight],
  ["Refresh", faArrowsRotate], ["Expand", faExpand],
  ["Compress", faCompress], ["External Link", faExternalLink],

  ["Database", faDatabase], ["Server", faServer],
  ["Terminal", faTerminal], ["Desktop", faDesktop],
  ["Mobile", faMobileScreenButton], ["Tablet", faTabletScreenButton],
  ["Keyboard", faKeyboard], ["Mouse", faMouse], ["WiFi", faWifi],
  ["Microchip", faMicrochip], ["Memory", faMemory],
  ["Hard Drive", faHardDrive], ["Gauge", faGauge],
  ["Chart Line", faChartLine], ["Chart Bar", faChartBar],
  ["Chart Pie", faChartPie], ["Chart Area", faChartArea],
  ["Project Diagram", faDiagramProject], ["Brain", faBrain],
  ["Robot", faRobot], ["AI Magic", faWandMagicSparkles],
  ["Code Branch", faCodeBranch], ["Bug", faBug],
  ["Sitemap", faSitemap], ["Network", faNetworkWired],
  ["Laptop Code", faLaptopCode],

  ["Edit Square", faPenToSquare], ["Scissors", faScissors],
  ["Crop", faCrop], ["Layers", faLayerGroup], ["Shapes", faShapes],
  ["Cube", faCube], ["Cubes", faCubes], ["Brush", faBrush],
  ["Droplet", faDroplet], ["Swatches", faSwatchbook],
  ["Fill", faFillDrip], ["Eraser", faEraser], ["Ruler", faRuler],
  ["Ruler Combined", faRulerCombined], ["Lightbulb", faLightbulb],
  ["Object Ungroup", faObjectUngroup], ["Border", faBorderAll],

  ["PDF", faFilePdf], ["Code File", faFileCode],
  ["Image File", faFileImage], ["Video File", faFileVideo],
  ["Audio File", faFileAudio], ["Text File", faFileLines],
  ["Excel File", faFileExcel], ["Word File", faFileWord],
  ["PowerPoint File", faFilePowerpoint], ["Archive", faFileArchive],
  ["ZIP File", faFileZipper], ["Download File", faFileArrowDown],
  ["Upload File", faFileArrowUp], ["Open Folder", faFolderOpen],
  ["New Folder", faFolderPlus], ["Remove Folder", faFolderMinus],
  ["Clipboard", faClipboard], ["Clipboard Check", faClipboardCheck],
  ["Paste", faPaste], ["List", faList], ["Checklist", faListCheck],
  ["Table", faTable], ["Book", faBook], ["Open Book", faBookOpen],

  ["Briefcase", faBriefcase], ["Building", faBuilding],
  ["Users", faUsers], ["User Group", faUserGroup],
  ["Add User", faUserPlus], ["Remove User", faUserMinus],
  ["Protected User", faUserShield], ["ID Card", faIdCard],
  ["Address Card", faAddressCard], ["Wallet", faWallet],
  ["Credit Card", faCreditCard], ["Money", faMoneyBill],
  ["Coins", faCoins], ["Receipt", faReceipt],
  ["Shopping Cart", faCartShopping],
  ["Shopping Basket", faBasketShopping], ["Store", faStore],
  ["Tag", faTag], ["Tags", faTags], ["Percentage", faPercent],
  ["Calculator", faCalculator], ["Simple Chart", faChartSimple],
  ["Target", faBullseye], ["Handshake", faHandshake],
  ["Award", faAward],

  ["Key", faKey], ["Fingerprint", faFingerprint],
  ["Shield", faShield], ["Unlock", faUnlock],
  ["Open Lock", faLockOpen], ["Hidden Eye", faEyeSlash],
  ["Warning Circle", faCircleExclamation],
  ["Warning", faTriangleExclamation],
  ["Question", faCircleQuestion], ["Error Circle", faCircleXmark],
  ["Add Circle", faCirclePlus], ["Remove Circle", faCircleMinus],
  ["Double Check", faCheckDouble], ["Virus Protection", faShieldVirus],
  ["User Lock", faUserLock], ["Verified User", faUserCheck],

  ["Headphones", faHeadphones], ["Microphone", faMicrophone],
  ["Podcast", faPodcast], ["Radio", faRadio],
  ["Volume High", faVolumeHigh], ["Volume Low", faVolumeLow],
  ["Mute", faVolumeMute], ["Pause", faPause], ["Stop", faStop],
  ["Forward", faForward], ["Backward", faBackward],
  ["Repeat", faRepeat], ["Comment Dots", faCommentDots],
  ["Comments", faComments], ["Message", faMessage],
  ["At Symbol", faAt], ["Hashtag", faHashtag],

  ["Map", faMap], ["Map Pin", faMapPin],
  ["Map Location", faMapLocationDot], ["Route", faRoute],
  ["Compass", faCompass], ["Flag", faFlag],
  ["Airplane", faPlane], ["Car", faCar], ["Train", faTrain],
  ["Bus", faBus], ["Bicycle", faBicycle], ["Ship", faShip],
  ["Truck", faTruck],

  ["Fire", faFire], ["Leaf", faLeaf], ["Tree", faTree],
  ["Water", faWater], ["Snowflake", faSnowflake],
  ["Umbrella", faUmbrella], ["Cloud Upload", faCloudArrowUp],
  ["Cloud Download", faCloudArrowDown], ["Trophy", faTrophy],
  ["Medal", faMedal], ["Crown", faCrown], ["Gaming", faGamepad],
  ["Fitness", faDumbbell], ["Running", faPersonRunning],
  ["Walking", faPersonWalking], ["Medical", faStethoscope],
  ["History", faClockRotateLeft], ["Power", faPowerOff],
  ["Circle Play", faCirclePlay], ["Circle Pause", faCirclePause],
  ["Circle Stop", faCircleStop],
];

const regularIcons: [string, IconDefinition][] = [
  ["Heart", faHeartRegular], ["Star", faStarRegular],
  ["User", faUserRegular], ["Bell", faBellRegular],
  ["Bookmark", faBookmarkRegular], ["Envelope", faEnvelopeRegular],
  ["File", faFileRegular], ["Image", faImageRegular],
  ["Clock", faClockRegular], ["Calendar", faCalendarRegular],
  ["Comment", faCommentRegular], ["Eye", faEyeRegular],
  ["Smile", faFaceSmile], ["Circle Check", faCircleCheck],
];

const brandIcons: [string, IconDefinition][] = [
  ["GitHub", faGithub], ["Instagram", faInstagram],
  ["Facebook", faFacebook], ["YouTube", faYoutube],
  ["WhatsApp", faWhatsapp], ["X", faXTwitter],
  ["LinkedIn", faLinkedin], ["Discord", faDiscord],
  ["Apple", faApple], ["Google", faGoogle], ["TikTok", faTiktok],
  ["Spotify", faSpotify], ["Chrome", faChrome], ["Amazon", faAmazon],
  ["Reddit", faReddit], ["Pinterest", faPinterest],
  ["Telegram", faTelegram], ["Snapchat", faSnapchat],
  ["WordPress", faWordpress], ["Figma", faFigma],
  ["Android", faAndroid], ["GitLab", faGitlab],
  ["Bitbucket", faBitbucket], ["Stack Overflow", faStackOverflow],
  ["CodePen", faCodepen], ["Behance", faBehance],
  ["Dribbble", faDribbble], ["NPM", faNpm],
  ["Node.js", faNodeJs], ["React", faReact], ["Vue.js", faVuejs],
  ["Angular", faAngular], ["HTML5", faHtml5], ["CSS3", faCss3Alt],
  ["JavaScript", faJs], ["Python", faPython], ["Java", faJava],
  ["PHP", faPhp], ["Laravel", faLaravel], ["Sass", faSass],
  ["Bootstrap", faBootstrap], ["Docker", faDocker],
  ["Linux", faLinux], ["Threads", faThreads], ["Tumblr", faTumblr],
  ["Vimeo", faVimeo], ["Twitch", faTwitch], ["Steam", faSteam],
  ["SoundCloud", faSoundcloud], ["DeviantArt", faDeviantart],
  ["Mastodon", faMastodon], ["Medium", faMedium],
  ["DEV Community", faDev], ["Dropbox", faDropbox],
  ["Google Drive", faGoogleDrive], ["Google Play", faGooglePlay],
  ["PayPal", faPaypal], ["Stripe", faStripe], ["Shopify", faShopify],
  ["Wix", faWix], ["Squarespace", faSquarespace],
  ["Slack", faSlack], ["Atlassian", faAtlassian],
  ["Jira", faJira], ["Trello", faTrello],
  ["Salesforce", faSalesforce], ["Amazon AWS", faAws],
  ["Microsoft", faMicrosoft],
];

const icons: IconItem[] = [
  ...solidIcons.map(([name, definition]) => ({
    name, definition, category: "Solid" as const,
  })),
  ...regularIcons.map(([name, definition]) => ({
    name, definition, category: "Regular" as const,
  })),
  ...brandIcons.map(([name, definition]) => ({
    name, definition, category: "Brands" as const,
  })),
];

const emojiGroups: { category: string; items: EmojiItem[] }[] = [
  {
    category: "Smileys",
    items: [
      ["😀", "Grinning Face"], ["😃", "Smiling Face"],
      ["😄", "Happy Face"], ["😁", "Beaming Face"],
      ["😆", "Laughing Face"], ["😅", "Grinning Sweat"],
      ["🤣", "Rolling Laugh"], ["😂", "Tears of Joy"],
      ["🙂", "Slight Smile"], ["🙃", "Upside Down"],
      ["😉", "Winking Face"], ["😊", "Blushing Smile"],
      ["😇", "Angel"], ["🥰", "Smiling Hearts"],
      ["😍", "Heart Eyes"], ["🤩", "Star Eyes"],
      ["😘", "Kiss Face"], ["😋", "Yum"],
      ["😎", "Sunglasses"], ["🤓", "Nerd"],
      ["🧐", "Monocle"], ["🤔", "Thinking"],
      ["🤫", "Shushing"], ["🤗", "Hugging"],
      ["🤭", "Hand Over Mouth"], ["🥳", "Party"],
      ["😴", "Sleeping"], ["🥱", "Yawning"],
      ["😭", "Crying"], ["😡", "Angry"],
      ["🤯", "Mind Blown"], ["🥶", "Cold"],
      ["🥵", "Hot"], ["😱", "Screaming"],
      ["🤠", "Cowboy"], ["🤖", "Robot"],
      ["👻", "Ghost"], ["💀", "Skull"],
      ["👽", "Alien"], ["👾", "Space Invader"],
    ].map(([emoji, name]) => ({ emoji, name, category: "Smileys" })),
  },
  {
    category: "Hands",
    items: [
      ["👋", "Waving Hand"], ["🤚", "Raised Back Hand"],
      ["🖐️", "Hand With Fingers"], ["✋", "Raised Hand"],
      ["🖖", "Vulcan Salute"], ["👌", "OK Hand"],
      ["🤌", "Pinched Fingers"], ["🤏", "Pinching Hand"],
      ["✌️", "Victory"], ["🤞", "Crossed Fingers"],
      ["🤟", "Love You Gesture"], ["🤘", "Rock On"],
      ["🤙", "Call Me"], ["👈", "Point Left"],
      ["👉", "Point Right"], ["👆", "Point Up"],
      ["👇", "Point Down"], ["☝️", "Index Up"],
      ["👍", "Thumbs Up"], ["👎", "Thumbs Down"],
      ["✊", "Raised Fist"], ["👊", "Fist Bump"],
      ["👏", "Clapping"], ["🙌", "Raised Hands"],
      ["👐", "Open Hands"], ["🤲", "Palms Up"],
      ["🙏", "Folded Hands"], ["💪", "Flexed Biceps"],
      ["🫶", "Heart Hands"], ["🫡", "Saluting"],
    ].map(([emoji, name]) => ({ emoji, name, category: "Hands" })),
  },
  {
    category: "Animals",
    items: [
      ["🐶", "Dog"], ["🐱", "Cat"], ["🐭", "Mouse"],
      ["🐹", "Hamster"], ["🐰", "Rabbit"], ["🦊", "Fox"],
      ["🐻", "Bear"], ["🐼", "Panda"], ["🐨", "Koala"],
      ["🐯", "Tiger"], ["🦁", "Lion"], ["🐮", "Cow"],
      ["🐷", "Pig"], ["🐸", "Frog"], ["🐵", "Monkey"],
      ["🐔", "Chicken"], ["🐧", "Penguin"], ["🐦", "Bird"],
      ["🦆", "Duck"], ["🦅", "Eagle"], ["🦉", "Owl"],
      ["🦇", "Bat"], ["🐺", "Wolf"], ["🐗", "Boar"],
      ["🐴", "Horse"], ["🦄", "Unicorn"], ["🐝", "Bee"],
      ["🦋", "Butterfly"], ["🐌", "Snail"], ["🐞", "Ladybug"],
      ["🐢", "Turtle"], ["🐍", "Snake"], ["🦎", "Lizard"],
      ["🦂", "Scorpion"], ["🐙", "Octopus"], ["🦑", "Squid"],
      ["🦀", "Crab"], ["🐬", "Dolphin"], ["🐳", "Whale"],
      ["🦈", "Shark"], ["🐊", "Crocodile"], ["🦓", "Zebra"],
      ["🦒", "Giraffe"], ["🐘", "Elephant"], ["🦏", "Rhino"],
      ["🦛", "Hippo"], ["🐪", "Camel"], ["🦘", "Kangaroo"],
      ["🦥", "Sloth"], ["🦦", "Otter"], ["🦔", "Hedgehog"],
    ].map(([emoji, name]) => ({ emoji, name, category: "Animals" })),
  },
  {
    category: "Food",
    items: [
      ["🍎", "Red Apple"], ["🍐", "Pear"], ["🍊", "Orange"],
      ["🍋", "Lemon"], ["🍌", "Banana"], ["🍉", "Watermelon"],
      ["🍇", "Grapes"], ["🍓", "Strawberry"], ["🫐", "Blueberries"],
      ["🍒", "Cherries"], ["🍑", "Peach"], ["🥭", "Mango"],
      ["🍍", "Pineapple"], ["🥥", "Coconut"], ["🥝", "Kiwi"],
      ["🍅", "Tomato"], ["🥑", "Avocado"], ["🥕", "Carrot"],
      ["🌽", "Corn"], ["🌶️", "Chili"], ["🥒", "Cucumber"],
      ["🥦", "Broccoli"], ["🍞", "Bread"], ["🥐", "Croissant"],
      ["🧀", "Cheese"], ["🍕", "Pizza"], ["🍔", "Burger"],
      ["🍟", "Fries"], ["🌭", "Hot Dog"], ["🌮", "Taco"],
      ["🌯", "Burrito"], ["🍜", "Noodles"], ["🍝", "Spaghetti"],
      ["🍣", "Sushi"], ["🍱", "Bento"], ["🍩", "Doughnut"],
      ["🍪", "Cookie"], ["🎂", "Cake"], ["🍫", "Chocolate"],
      ["🍿", "Popcorn"], ["☕", "Coffee"], ["🧋", "Bubble Tea"],
      ["🥤", "Drink"], ["🧃", "Juice"], ["🍵", "Tea"],
    ].map(([emoji, name]) => ({ emoji, name, category: "Food" })),
  },
  {
    category: "Nature",
    items: [
      ["🌸", "Cherry Blossom"], ["🌹", "Rose"],
      ["🌻", "Sunflower"], ["🌷", "Tulip"], ["🌼", "Blossom"],
      ["🌺", "Hibiscus"], ["🌵", "Cactus"], ["🌴", "Palm Tree"],
      ["🌲", "Evergreen Tree"], ["🌳", "Tree"],
      ["🍀", "Four Leaf Clover"], ["🌿", "Herb"],
      ["🍁", "Maple Leaf"], ["🍂", "Fallen Leaf"],
      ["🍃", "Leaves"], ["🌱", "Seedling"],
      ["☀️", "Sun"], ["🌤️", "Sun Behind Cloud"],
      ["⛅", "Partly Cloudy"], ["🌧️", "Rain"],
      ["⛈️", "Thunderstorm"], ["🌈", "Rainbow"],
      ["❄️", "Snowflake"], ["☃️", "Snowman"],
      ["🔥", "Fire"], ["💧", "Droplet"],
      ["🌊", "Wave"], ["🌙", "Crescent Moon"],
      ["⭐", "Star"], ["🌟", "Glowing Star"],
      ["✨", "Sparkles"], ["⚡", "Lightning"],
      ["🌪️", "Tornado"], ["🌍", "Earth"],
      ["🌎", "Earth Americas"], ["🌏", "Earth Asia"],
    ].map(([emoji, name]) => ({ emoji, name, category: "Nature" })),
  },
  {
    category: "Travel",
    items: [
      ["🚗", "Car"], ["🚕", "Taxi"], ["🚙", "SUV"],
      ["🚌", "Bus"], ["🚎", "Trolleybus"], ["🏎️", "Racing Car"],
      ["🚓", "Police Car"], ["🚑", "Ambulance"],
      ["🚒", "Fire Engine"], ["🚚", "Delivery Truck"],
      ["🚲", "Bicycle"], ["🛵", "Scooter"], ["🏍️", "Motorcycle"],
      ["✈️", "Airplane"], ["🛫", "Departing Plane"],
      ["🛬", "Landing Plane"], ["🚀", "Rocket"],
      ["🛸", "Flying Saucer"], ["🚁", "Helicopter"],
      ["🚢", "Ship"], ["⛵", "Sailboat"], ["🚂", "Train"],
      ["🚆", "Railway"], ["🚇", "Metro"],
      ["🚉", "Station"], ["🗺️", "World Map"],
      ["🧭", "Compass"], ["🏖️", "Beach"],
      ["🏝️", "Island"], ["🏔️", "Mountain"],
      ["🌋", "Volcano"], ["🏕️", "Camping"],
      ["🏨", "Hotel"], ["🏰", "Castle"],
      ["🗽", "Statue of Liberty"], ["🗼", "Tokyo Tower"],
    ].map(([emoji, name]) => ({ emoji, name, category: "Travel" })),
  },
  {
    category: "Activities",
    items: [
      ["⚽", "Soccer"], ["🏀", "Basketball"],
      ["🏈", "Football"], ["⚾", "Baseball"],
      ["🎾", "Tennis"], ["🏐", "Volleyball"],
      ["🏓", "Ping Pong"], ["🏸", "Badminton"],
      ["🥊", "Boxing"], ["🥋", "Martial Arts"],
      ["🎮", "Video Game"], ["🕹️", "Joystick"],
      ["🎯", "Target"], ["🎲", "Dice"],
      ["♟️", "Chess"], ["🎨", "Art"],
      ["🎭", "Theater"], ["🎬", "Movie"],
      ["🎤", "Microphone"], ["🎧", "Headphones"],
      ["🎼", "Music Score"], ["🎹", "Piano"],
      ["🥁", "Drum"], ["🎸", "Guitar"],
      ["🎺", "Trumpet"], ["🎻", "Violin"],
      ["🏆", "Trophy"], ["🥇", "Gold Medal"],
      ["🥈", "Silver Medal"], ["🥉", "Bronze Medal"],
      ["🎟️", "Ticket"], ["🎪", "Circus"],
    ].map(([emoji, name]) => ({ emoji, name, category: "Activities" })),
  },
  {
    category: "Objects",
    items: [
      ["💻", "Laptop"], ["🖥️", "Desktop"],
      ["⌨️", "Keyboard"], ["🖱️", "Mouse"],
      ["📱", "Mobile Phone"], ["📲", "Phone With Arrow"],
      ["☎️", "Telephone"], ["📷", "Camera"],
      ["📸", "Camera Flash"], ["📹", "Video Camera"],
      ["🎥", "Movie Camera"], ["📺", "Television"],
      ["📻", "Radio"], ["🔋", "Battery"],
      ["🔌", "Electric Plug"], ["💡", "Light Bulb"],
      ["🔦", "Flashlight"], ["🕯️", "Candle"],
      ["📚", "Books"], ["📖", "Open Book"],
      ["📝", "Memo"], ["📄", "Document"],
      ["📁", "Folder"], ["📂", "Open Folder"],
      ["📦", "Package"], ["✉️", "Envelope"],
      ["📧", "Email"], ["📌", "Pushpin"],
      ["📎", "Paperclip"], ["✂️", "Scissors"],
      ["🔒", "Locked"], ["🔑", "Key"],
      ["🛡️", "Shield"], ["⚙️", "Gear"],
      ["🔧", "Wrench"], ["🧰", "Toolbox"],
      ["🧲", "Magnet"], ["🧪", "Test Tube"],
    ].map(([emoji, name]) => ({ emoji, name, category: "Objects" })),
  },
  {
    category: "Symbols",
    items: [
      ["❤️", "Red Heart"], ["🧡", "Orange Heart"],
      ["💛", "Yellow Heart"], ["💚", "Green Heart"],
      ["💙", "Blue Heart"], ["💜", "Purple Heart"],
      ["🖤", "Black Heart"], ["🤍", "White Heart"],
      ["💔", "Broken Heart"], ["💕", "Two Hearts"],
      ["💯", "Hundred Points"], ["💢", "Anger"],
      ["💥", "Collision"], ["💫", "Dizzy"],
      ["💬", "Speech Bubble"], ["💭", "Thought Bubble"],
      ["♻️", "Recycling"], ["✅", "Check Mark"],
      ["❌", "Cross Mark"], ["❓", "Question Mark"],
      ["❗", "Exclamation"], ["⚠️", "Warning"],
      ["🚫", "Prohibited"], ["🔞", "Adults Only"],
      ["♻️", "Recycle"], ["🔴", "Red Circle"],
      ["🟠", "Orange Circle"], ["🟡", "Yellow Circle"],
      ["🟢", "Green Circle"], ["🔵", "Blue Circle"],
      ["🟣", "Purple Circle"], ["⚫", "Black Circle"],
      ["⚪", "White Circle"], ["⭐", "Star"],
      ["✨", "Sparkles"], ["💤", "Sleep"],
    ].map(([emoji, name]) => ({ emoji, name, category: "Symbols" })),
  },
  {
    category: "Flags",
    items: [
      ["🇵🇰", "Pakistan"], ["🇺🇸", "United States"],
      ["🇬🇧", "United Kingdom"], ["🇨🇦", "Canada"],
      ["🇦🇺", "Australia"], ["🇮🇳", "India"],
      ["🇩🇪", "Germany"], ["🇫🇷", "France"],
      ["🇮🇹", "Italy"], ["🇪🇸", "Spain"],
      ["🇯🇵", "Japan"], ["🇰🇷", "South Korea"],
      ["🇨🇳", "China"], ["🇧🇷", "Brazil"],
      ["🇸🇦", "Saudi Arabia"], ["🇦🇪", "United Arab Emirates"],
      ["🇹🇷", "Turkey"], ["🇵🇸", "Palestine"],
      ["🇿🇦", "South Africa"], ["🇳🇿", "New Zealand"],
      ["🇲🇽", "Mexico"], ["🇷🇺", "Russia"],
      ["🇺🇦", "Ukraine"], ["🇳🇬", "Nigeria"],
    ].map(([emoji, name]) => ({ emoji, name, category: "Flags" })),
  },
];

const emojis = emojiGroups.flatMap((group) => group.items);

function createSvg(definition: IconDefinition, color: string) {
  const [width, height, , , paths] = definition.icon;
  const pathList = Array.isArray(paths) ? paths : [paths];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="${color}" preserveAspectRatio="xMidYMid meet">${pathList
    .map((path) => `<path fill="${color}" d="${path}"/>`)
    .join("")}</svg>`;
}

function safeFilename(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error(`Could not create ${mimeType} image.`)),
      mimeType,
      quality
    );
  });
}

async function createIco(pngBlob: Blob): Promise<Blob> {
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const header = new ArrayBuffer(22);
  const view = new DataView(header);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);
  view.setUint8(6, 0);
  view.setUint8(7, 0);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngBytes.length, true);
  view.setUint32(18, 22, true);

  return new Blob([header, pngBytes], { type: "image/x-icon" });
}

export function FontAwesomeToPngWorkspace() {
  const [tab, setTab] = useState<StudioTab>("icons");
  const [category, setCategory] = useState<IconCategory>("Solid");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("Home");

  const [emojiCategory, setEmojiCategory] = useState("Smileys");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [copiedEmoji, setCopiedEmoji] = useState("");

  const [iconColor, setIconColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("#C77B53");
  const [transparent, setTransparent] = useState(true);

  const [size, setSize] = useState(512);
  const [customSize, setCustomSize] = useState("512");
  const [format, setFormat] = useState<ExportFormat>("PNG");

  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredIcons = useMemo(() => {
    const query = search.trim().toLowerCase();
    return icons.filter((item) =>
      item.category === category && item.name.toLowerCase().includes(query)
    );
  }, [category, search]);

  const selectedIcon = useMemo(() => {
    return icons.find((item) => item.name === selected && item.category === category)
      ?? icons.find((item) => item.name === selected)
      ?? icons[0];
  }, [selected, category]);

  const filteredEmojis = useMemo(() => {
    const query = emojiSearch.trim().toLowerCase();
    return emojis.filter((item) => {
      const matchesCategory = emojiCategory === "All" || item.category === emojiCategory;
      const matchesSearch = !query ||
        item.name.toLowerCase().includes(query) ||
        item.emoji.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [emojiCategory, emojiSearch]);

  const svgMarkup = useMemo(
    () => createSvg(selectedIcon.definition, iconColor),
    [selectedIcon, iconColor]
  );

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function selectCategory(value: IconCategory) {
    setCategory(value);
    setSearch("");
    const firstIcon = icons.find((item) => item.category === value);
    if (firstIcon) setSelected(firstIcon.name);
    clearMessages();
  }

  function changeSize(value: number) {
    const safeValue = Math.max(16, Math.min(2048, Math.round(value)));
    setSize(safeValue);
    setCustomSize(String(safeValue));
    setError("");
  }

  async function copyEmoji(item: EmojiItem) {
    try {
      await navigator.clipboard.writeText(item.emoji);
      setCopiedEmoji(item.emoji);
      setMessage(`${item.name} copied successfully.`);
      setError("");
    } catch {
      setError("Clipboard access was blocked. Please allow clipboard permissions.");
      setMessage("");
    }
  }

  async function downloadIcon() {
    if (exporting) return;

    setExporting(true);
    clearMessages();

    let svgUrl = "";

    try {
      if (format === "SVG") {
        const svgBlob = new Blob([svgMarkup], {
          type: "image/svg+xml;charset=utf-8",
        });
        downloadBlob(svgBlob, `brobex-${safeFilename(selectedIcon.name)}.svg`);
        setMessage("SVG exported successfully.");
        return;
      }

      const svgBlob = new Blob([svgMarkup], {
        type: "image/svg+xml;charset=utf-8",
      });
      svgUrl = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.decoding = "async";

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not render this icon."));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not create an export canvas.");

      if (format === "JPG" || format === "JPEG" || !transparent) {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, size, size);
      }

      const naturalWidth = image.naturalWidth || 1;
      const naturalHeight = image.naturalHeight || 1;
      const scale = Math.min((size * 0.76) / naturalWidth, (size * 0.76) / naturalHeight);
      const width = naturalWidth * scale;
      const height = naturalHeight * scale;

      context.drawImage(
        image,
        (size - width) / 2,
        (size - height) / 2,
        width,
        height
      );

      let blob: Blob;
      let extension: string;

      if (format === "ICO") {
        const pngBlob = await canvasToBlob(canvas, "image/png");
        blob = await createIco(pngBlob);
        extension = "ico";
      } else {
        const mimeType =
          format === "WebP" ? "image/webp" :
            format === "JPG" || format === "JPEG" ? "image/jpeg" :
              "image/png";

        blob = await canvasToBlob(canvas, mimeType);
        extension = format.toLowerCase();
      }

      downloadBlob(
        blob,
        `brobex-${safeFilename(selectedIcon.name)}-${size}x${size}.${extension}`
      );

      canvas.width = 0;
      canvas.height = 0;
      setMessage(`${format} exported successfully.`);
    } catch (cause) {
      console.error("Icon export failed:", cause);
      setError(cause instanceof Error ? cause.message : "Export failed. Please try again.");
    } finally {
      if (svgUrl) URL.revokeObjectURL(svgUrl);
      setExporting(false);
    }
  }

  const panelClass =
    "min-w-0 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#101313]/95 p-4 sm:p-6";

  const fieldClass =
    "min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#090B0B] px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#C77B53]";

  const tabClass = (active: boolean) =>
    `min-h-11 rounded-xl border px-4 py-3 text-xs font-semibold transition ${active
      ? "border-[#C77B53] bg-[#C77B53] text-[#160D09]"
      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
    }`;

  return (
    <main className="relative isolate min-h-screen w-full overflow-x-clip bg-[#080A0A] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(183,103,60,0.13),transparent_48%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:52px_52px]" />

      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 sm:mb-14">
          <span className="text-lg font-black tracking-[0.2em] sm:text-xl">
            BROBEX<span className="text-[#C77B53]">.</span>
          </span>
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-white/65 sm:text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            Free · Browser processing
          </span>
        </header>

        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex max-w-full rounded-full border border-[#C77B53]/25 bg-[#C77B53]/[0.08] px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#E4A17D] sm:text-xs">
            BROBEX ICON & EMOJI STUDIO
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.055em] sm:text-5xl md:text-6xl">
            Creative assets,
            <span className="mt-1 block bg-gradient-to-r from-[#F0C3A7] via-[#C77B53] to-[#E6A17B] bg-clip-text text-transparent sm:mt-2">
              ready to use.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55 sm:mt-5 sm:text-base sm:leading-7">
            Explore professional icons, copy emojis, customize your designs and export assets in multiple formats.
          </p>
        </section>

        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-2 sm:mt-10">
          <button type="button" onClick={() => { setTab("icons"); clearMessages(); }} className={tabClass(tab === "icons")}>
            Icon Studio
            <span className="ml-2 opacity-70">({icons.length})</span>
          </button>
          <button type="button" onClick={() => { setTab("emojis"); clearMessages(); }} className={tabClass(tab === "emojis")}>
            Emoji Studio
            <span className="ml-2 opacity-70">({emojis.length})</span>
          </button>
        </div>

        {tab === "icons" ? (
          <section className="mx-auto mt-4 grid w-full max-w-6xl min-w-0 grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
            <div className={`${panelClass} w-full`}>
              <div className="grid grid-cols-3 gap-2">
                {(["Solid", "Regular", "Brands"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={category === item}
                    onClick={() => selectCategory(item)}
                    className={tabClass(category === item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-4 sm:mt-5">
                <label htmlFor="font-awesome-search" className="mb-2 block text-xs font-medium text-white/55">
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

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-white/60">{category} icons</p>
                <span className="text-[10px] text-white/35">{filteredIcons.length} available</span>
              </div>

              <div className="mt-3 grid max-h-[540px] grid-cols-3 gap-2 overflow-x-hidden overflow-y-auto overscroll-contain pr-1 sm:grid-cols-4 sm:gap-3 md:grid-cols-5">
                {filteredIcons.map((item) => {
                  const active = selectedIcon.name === item.name && selectedIcon.category === item.category;
                  return (
                    <button
                      key={`${item.category}-${item.name}`}
                      type="button"
                      aria-label={`Select ${item.name} icon`}
                      aria-pressed={active}
                      onClick={() => {
                        setSelected(item.name);
                        clearMessages();
                      }}
                      className={`group flex min-h-[92px] min-w-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border p-2 transition sm:min-h-[108px] sm:gap-3 sm:p-3 ${active
                          ? "border-[#C77B53] bg-[#C77B53]/10 shadow-[0_0_20px_rgba(199,123,83,0.08)]"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-7 w-7 max-w-full shrink-0 items-center justify-center text-[#E4A17D] transition group-hover:scale-110 sm:h-8 sm:w-8 [&>svg]:h-full [&>svg]:w-full"
                        dangerouslySetInnerHTML={{
                          __html: createSvg(item.definition, active ? "#F0C3A7" : "#E4A17D"),
                        }}
                      />
                      <span className="w-full truncate text-center text-[10px] font-medium text-white/65 sm:text-xs">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredIcons.length === 0 && (
                <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
                  <p className="text-sm font-semibold text-white/75">No icons found</p>
                  <p className="mt-2 text-xs leading-5 text-white/40">
                    Try another search term or select a different category.
                  </p>
                  <button type="button" onClick={() => setSearch("")} className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-xs text-[#E4A17D] transition hover:bg-white/[0.05]">
                    Clear search
                  </button>
                </div>
              )}
            </div>

            <aside className={`${panelClass} w-full lg:sticky lg:top-6`}>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold sm:text-base">Customize your icon</h2>
                  <p className="mt-1 truncate text-xs text-white/40">
                    {selectedIcon.name} · {selectedIcon.category}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg border border-[#C77B53]/20 bg-[#C77B53]/10 px-2 py-1 text-[9px] font-semibold text-[#E4A17D]">
                  {format}
                </span>
              </div>

              <div className="mt-5 flex aspect-square w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(45deg,#171a1a_25%,transparent_25%),linear-gradient(-45deg,#171a1a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#171a1a_75%),linear-gradient(-45deg,transparent_75%,#171a1a_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0] p-5 sm:p-7">
                <div
                  className="flex h-full w-full max-h-64 max-w-64 items-center justify-center overflow-hidden rounded-2xl p-5 sm:p-7"
                  style={{ backgroundColor: transparent ? "transparent" : backgroundColor }}
                >
                  <span
                    aria-label={`${selectedIcon.name} icon preview`}
                    role="img"
                    className="flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: svgMarkup }}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-4">
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
                    <span className="truncate text-xs text-white/70">{iconColor.toUpperCase()}</span>
                  </span>
                </label>

                <label className="flex min-h-9 cursor-pointer items-center gap-3 text-xs text-white/65">
                  <input
                    type="checkbox"
                    checked={transparent}
                    onChange={(event) => setTransparent(event.target.checked)}
                    className="h-4 w-4 shrink-0 accent-[#C77B53]"
                  />
                  Transparent background
                </label>

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
                      <span className="truncate text-xs text-white/70">{backgroundColor.toUpperCase()}</span>
                    </span>
                  </label>
                )}

                <label className="block text-xs text-white/60">
                  Export format
                  <select
                    value={format}
                    onChange={(event) => setFormat(event.target.value as ExportFormat)}
                    className={`${fieldClass} mt-2`}
                  >
                    <option value="PNG">PNG · Transparent supported</option>
                    <option value="JPG">JPG · Image</option>
                    <option value="JPEG">JPEG · Image</option>
                    <option value="WebP">WebP · Optimized</option>
                    <option value="SVG">SVG · Vector</option>
                    <option value="ICO">ICO · Favicon</option>
                  </select>
                </label>

                <label className="block text-xs text-white/60">
                  Export dimensions
                  <select
                    value={PRESET_SIZES.includes(size) ? String(size) : "custom"}
                    onChange={(event) => {
                      if (event.target.value !== "custom") changeSize(Number(event.target.value));
                    }}
                    className={`${fieldClass} mt-2`}
                  >
                    {PRESET_SIZES.map((value) => (
                      <option key={value} value={value}>{value} × {value}px</option>
                    ))}
                    {!PRESET_SIZES.includes(size) && (
                      <option value="custom">Custom · {size}px</option>
                    )}
                  </select>
                </label>

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
                      if (!value.trim()) return;
                      const parsed = Number(value);
                      if (Number.isInteger(parsed) && parsed >= 16 && parsed <= 2048) {
                        setSize(parsed);
                      }
                    }}
                    onBlur={() => {
                      const parsed = Number(customSize);
                      changeSize(Number.isFinite(parsed) ? parsed : 512);
                    }}
                    className={`${fieldClass} mt-2`}
                  />
                </label>

                <button
                  type="button"
                  onClick={downloadIcon}
                  disabled={exporting}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C77B53] px-4 py-3 text-sm font-semibold text-[#160D09] transition hover:bg-[#DFA17E] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {exporting ? "Preparing export..." : `Download ${format} · ${size}px`}
                </button>

                {error && (
                  <p role="alert" className="break-words rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-xs leading-5 text-red-300">
                    {error}
                  </p>
                )}
                {message && (
                  <p role="status" aria-live="polite" className="break-words rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-xs leading-5 text-emerald-300">
                    {message}
                  </p>
                )}
              </div>
            </aside>
          </section>
        ) : (
          <section className="mx-auto mt-4 grid w-full max-w-6xl min-w-0 grid-cols-1 gap-4">
            <div className={panelClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Emoji Library</h2>
                  <p className="mt-1 text-xs text-white/40">Select any emoji to copy it instantly.</p>
                </div>
                <span className="rounded-full border border-[#C77B53]/20 bg-[#C77B53]/10 px-3 py-2 text-xs text-[#E4A17D]">
                  {filteredEmojis.length} emojis
                </span>
              </div>

              <label htmlFor="emoji-search" className="mb-2 mt-5 block text-xs font-medium text-white/55">
                Search emojis
              </label>
              <input
                id="emoji-search"
                type="search"
                value={emojiSearch}
                onChange={(event) => setEmojiSearch(event.target.value)}
                placeholder="Search smile, heart, dog, rocket..."
                className={fieldClass}
              />

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {["All", ...emojiGroups.map((group) => group.category)].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setEmojiCategory(item)}
                    className={`shrink-0 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${emojiCategory === item
                        ? "border-[#C77B53] bg-[#C77B53] text-[#160D09]"
                        : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                      }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {copiedEmoji && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{copiedEmoji}</span>
                    <span className="text-xs text-emerald-300">Emoji copied to clipboard</span>
                  </div>
                  <button type="button" onClick={() => setCopiedEmoji("")} className="text-xs text-white/50 hover:text-white">
                    Dismiss
                  </button>
                </div>
              )}

              <div className="mt-5 grid max-h-[600px] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                {filteredEmojis.map((item, index) => (
                  <button
                    key={`${item.category}-${item.name}-${index}`}
                    type="button"
                    title={`${item.name} · Click to copy`}
                    aria-label={`Copy ${item.name} emoji`}
                    onClick={() => copyEmoji(item)}
                    className={`group flex min-h-[82px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border p-2 transition hover:-translate-y-0.5 hover:border-[#C77B53]/60 hover:bg-[#C77B53]/10 ${copiedEmoji === item.emoji
                        ? "border-emerald-400/40 bg-emerald-400/[0.08]"
                        : "border-white/[0.07] bg-white/[0.02]"
                      }`}
                  >
                    <span className="text-2xl transition group-hover:scale-110 sm:text-3xl">{item.emoji}</span>
                    <span className="w-full truncate text-center text-[9px] text-white/45 sm:text-[10px]">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>

              {filteredEmojis.length === 0 && (
                <div className="flex min-h-40 flex-col items-center justify-center text-center">
                  <p className="text-sm font-semibold text-white/75">No emojis found</p>
                  <p className="mt-2 text-xs text-white/40">Try a different search.</p>
                  <button
                    type="button"
                    onClick={() => { setEmojiSearch(""); setEmojiCategory("All"); }}
                    className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-xs text-[#E4A17D]"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-4 break-words rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-xs text-red-300">
                  {error}
                </p>
              )}
              {message && (
                <p role="status" aria-live="polite" className="mt-4 break-words rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-xs text-emerald-300">
                  {message}
                </p>
              )}
            </div>
          </section>
        )}

        <footer className="mx-auto mt-10 max-w-6xl border-t border-white/[0.07] pt-6 text-center sm:mt-14">
          <p className="text-[11px] leading-6 text-white/35 sm:text-xs">
            BROBEX Image Tools · Icon & Emoji Studio
          </p>
          <p className="mt-1 text-[10px] text-white/25">
            Customize, export and copy creative assets directly in your browser.
          </p>
        </footer>
      </div>
    </main>
  );
}
