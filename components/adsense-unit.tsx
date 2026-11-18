"use client";

import { Code2, PlayCircle, Sparkles } from "lucide-react";

/** Branded creator promotion used wherever an advertisement slot existed. */
export function AdSenseUnit() {
  return (
    <aside className="brobex-creator-promo" aria-label="BROBEX Code YouTube channel">
      <div className="brobex-creator-promo__top"><span><Code2 size={16} /> BROBEX CODE</span><Sparkles size={16} aria-hidden="true" /></div>
      <div className="brobex-creator-promo__body">
        <span className="brobex-creator-promo__eyebrow">BUILD · LEARN · CREATE</span>
        <h3>Level up your coding skills.</h3>
        <p>Explore practical web development tutorials, tools and projects on our YouTube channel.</p>
        <a href="https://www.youtube.com/@BrobexCode" target="_blank" rel="noopener noreferrer"><PlayCircle size={17} /> Watch Code Tutorials <span>@BrobexCode</span></a>
      </div>
    </aside>
  );
}
