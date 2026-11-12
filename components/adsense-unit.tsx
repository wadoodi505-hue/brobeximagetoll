"use client";

import { useEffect, useRef } from "react";

const ADSENSE_CLIENT = "ca-pub-2771980465268081";
const ADSENSE_SLOT = "7567140920";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, never>>;
  }
}

/**
 * Responsive AdSense display unit. The AdSense library itself is loaded once
 * from app/layout.tsx; this component only registers the ad slot.
 */
export function AdSenseUnit() {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current || !adRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch (error) {
      // Ad blockers, consent settings, or an unavailable AdSense response
      // should never interrupt the image editor.
      if (process.env.NODE_ENV !== "production") {
        console.info("BROBEX AdSense slot was not initialized.", error);
      }
    }
  }, []);

  return (
    <aside className="brobex-adsense-placement" aria-label="Advertisement">
      <span className="brobex-adsense-label">ADVERTISEMENT</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: 90 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
