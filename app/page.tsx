"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Minimize2,
  Maximize2,
  RefreshCw,
  Sliders,
  Share2,
  FileCheck,
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowRight,
  Image as ImageIcon,
  Crop,
  FileText,
  CheckCircle2
} from "lucide-react";

interface Tool {
  id: string;
  title: string;
  description: string;
  category: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  slug: string;
}

const CATEGORIES = [
  "All Tools",
  "Most Used",
  "Compression",
  "Resizing",
  "Format Conversion",
  "DPI & Quality",
  "Social Media",
  "ID & Passport"
];

const TOOLS_DATA: Tool[] = [
  {
    id: "1",
    title: "Compress Image to 50KB",
    description: "Reduce JPEG/PNG file size instantly to exact target KB.",
    category: "Compression",
    badge: "Popular",
    icon: Minimize2,
    slug: "compress-image-to-50kb"
  },
  {
    id: "2",
    title: "Compress Image to 20KB",
    description: "Ideal for government forms and online application portals.",
    category: "Compression",
    badge: "Fast",
    icon: Minimize2,
    slug: "compress-image-to-20kb"
  },
  {
    id: "3",
    title: "Resize Image in Pixels",
    description: "Exact width and height resizing with aspect ratio lock.",
    category: "Resizing",
    badge: "Essential",
    icon: Maximize2,
    slug: "resize-image-pixel"
  },
  {
    id: "4",
    title: "Convert HEIC to JPG",
    description: "Transform iPhone HEIC photos into universally compatible JPEGs.",
    category: "Format Conversion",
    badge: "Trending",
    icon: RefreshCw,
    slug: "heic-to-jpg"
  },
  {
    id: "5",
    title: "Remove Background",
    description: "AI-powered instant background removal with transparent output.",
    category: "Most Used",
    badge: "AI Tool",
    icon: Sparkles,
    slug: "remove-background-from-image"
  },
  {
    id: "6",
    title: "Convert WebP to JPG",
    description: "Batch convert WebP images to standard JPG format in seconds.",
    category: "Format Conversion",
    icon: RefreshCw,
    slug: "webp-to-jpg"
  },
  {
    id: "7",
    title: "Resize Image in KB / MB",
    description: "Compress photos down to any custom file size limit.",
    category: "Compression",
    badge: "Popular",
    icon: Sliders,
    slug: "resize-image-to-kb"
  },
  {
    id: "8",
    title: "Passport Photo Maker",
    description: "Crop and format photos for passport, visa, and ID cards.",
    category: "ID & Passport",
    badge: "Required",
    icon: FileCheck,
    slug: "passport-photo-maker"
  },
  {
    id: "9",
    title: "Instagram Square Crop",
    description: "Resize and pad images for perfect Instagram grid posts.",
    category: "Social Media",
    icon: Share2,
    slug: "instagram-square-crop"
  },
  {
    id: "10",
    title: "Change Image DPI",
    description: "Modify image resolution to 150, 300, or custom DPI settings.",
    category: "DPI & Quality",
    icon: Sliders,
    slug: "change-image-dpi"
  },
  {
    id: "11",
    title: "Blur Background",
    description: "Professional portrait depth effect with adjustable blur radius.",
    category: "Most Used",
    badge: "AI Tool",
    icon: ImageIcon,
    slug: "blur-background"
  },
  {
    id: "12",
    title: "PNG to JPG Converter",
    description: "Convert transparent PNGs to solid white or black background JPEGs.",
    category: "Format Conversion",
    icon: RefreshCw,
    slug: "png-to-jpg"
  },
  {
    id: "13",
    title: "Compress PNG Image",
    description: "Lossless compression for PNG graphics without quality loss.",
    category: "Compression",
    icon: Minimize2,
    slug: "compress-png"
  },
  {
    id: "14",
    title: "YouTube Thumbnail Resizer",
    description: "Exact 1280x720 dimensions for high-converting video thumbnails.",
    category: "Social Media",
    badge: "Popular",
    icon: Share2,
    slug: "youtube-thumbnail-resizer"
  },
  {
    id: "15",
    title: "Blur Any Object",
    description: "Privacy protection tool to obscure faces, text, and sensitive details.",
    category: "Most Used",
    badge: "New",
    icon: Crop,
    slug: "blur-any-object"
  },
  {
    id: "16",
    title: "Image to PDF Converter",
    description: "Combine multiple JPG or PNG images into a single clean PDF document.",
    category: "Format Conversion",
    icon: FileText,
    slug: "image-to-pdf"
  }
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Tools");

  const filteredTools = useMemo(() => {
    return TOOLS_DATA.filter(tool => {
      const matchesSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "All Tools" || tool.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">

      {/* HERO SECTION & HERO SEARCH BAR */}
      <section className="bg-white border-b border-slate-200 pt-12 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-100">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            100% Free Client-Side Processing • No Server Uploads
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
            All-in-One Free Online Image Tools
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Instant browser-based image compression, format conversion, pixel resizing, and AI background removal tools.
          </p>

          {/* Instant Live Search Input */}
          <div className="relative max-w-2xl mx-auto shadow-lg shadow-blue-500/5 rounded-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search image tools (e.g. compress to 50KB, HEIC to JPG, resize)..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* CATEGORY TABS & NAVIGATION PILLS */}
        <div className="max-w-6xl mx-auto mt-8">
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none px-2">
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 hover:border-blue-500"
                    }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* AD PLACEMENT SLOT (AdSense Ready) */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6">
        <div className="w-full min-h-[90px] bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium uppercase tracking-wider">
          Advertisement Banner
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeCategory === "All Tools" ? "Featured & All Tools" : activeCategory}
            </h2>
            <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              {filteredTools.length}
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Fast, secure & client-side
          </span>
        </div>

        {/* TOOL CARD GRID SYSTEM */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="group bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between transform -translate-y-0 hover:-translate-y-1 transition-all duration-200 hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-500 cursor-pointer relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                        <IconComponent className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-200" />
                      </div>
                      {tool.badge && (
                        <span className="bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-600 group-hover:text-blue-600">
                    <span>Use Tool</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No tools found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search query or selecting a different category.</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("All Tools"); }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* AD PLACEMENT SLOT (AdSense Ready) */}
        <div className="w-full min-h-[90px] bg-slate-100 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium uppercase tracking-wider my-10">
          Advertisement Banner
        </div>

        {/* Informational Section for SEO & User Guidance */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mt-12">
          <div className="max-w-3xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Why Use Brobex Image Tools?</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Our platform offers lightning-fast, secure client-side image processing. Whether you need to compress images down to exact byte limits (like 20KB or 50KB for job applications), convert modern HEIC iPhone photos to standard JPG, or resize pixels for social media banners, every operation runs directly in your browser.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">100% Secure</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Files never leave your device.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Lightning Fast</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Instant browser processing.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Completely Free</h4>
                  <p className="text-xs text-slate-500 mt-0.5">No registration or limits.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Brobex Image Tools</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}