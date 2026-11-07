"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Check, Copy, RefreshCw } from "lucide-react";

type Props = { direction: "mb-to-kb" | "kb-to-mb"; title: string };

export function FileSizeConverterWorkspace({ direction, title }: Props) {
  const [value, setValue] = useState("1");
  const [precision, setPrecision] = useState("2");
  const [copied, setCopied] = useState(false);
  const from = direction === "mb-to-kb" ? "MB" : "KB";
  const to = direction === "mb-to-kb" ? "KB" : "MB";
  const result = useMemo(() => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return null;
    return direction === "mb-to-kb" ? number * 1024 : number / 1024;
  }, [value, direction]);
  const formatted = result === null ? "" : result.toLocaleString(undefined, {
    maximumFractionDigits: Number(precision),
    minimumFractionDigits: 0,
  });

  async function copyResult() {
    if (result === null) return;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="bc-converter">
      <div className="bc-heading">
        <div>
          <span className="bc-eyebrow">BROBEX FILE SIZE UTILITY</span>
          <h2>{title}</h2>
          <p>Convert digital file sizes using the standard binary relationship: 1 MB = 1,024 KB.</p>
        </div>
      </div>
      <div className="bc-converter-card">
        <label className="bc-field">
          <span>Enter size in {from}</span>
          <div className="bc-input-suffix">
            <input type="number" min="0" step="any" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Enter a value" />
            <span>{from}</span>
          </div>
        </label>
        <div className="bc-converter-arrow"><ArrowDownUp size={19} /></div>
        <div className="bc-converter-output">
          <span>Converted size</span>
          <strong>{result === null ? "—" : formatted}</strong>
          <small>{to}</small>
        </div>
        <div className="bc-converter-footer">
          <label className="bc-field bc-precision">
            <span>Decimal places</span>
            <select value={precision} onChange={(event) => setPrecision(event.target.value)}>
              <option value="0">0</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="6">6</option>
            </select>
          </label>
          <button type="button" className="bc-button bc-button-primary" onClick={copyResult} disabled={result === null}>
            {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy result"}
          </button>
          <button type="button" className="bc-button bc-button-secondary" onClick={() => { setValue("1"); setPrecision("2"); setCopied(false); }}>
            <RefreshCw size={15} /> Reset
          </button>
        </div>
      </div>
      <div className="bc-footnote"><ArrowDownUp size={16} /><span>Calculation: {direction === "mb-to-kb" ? "MB × 1,024 = KB" : "KB ÷ 1,024 = MB"}. This utility converts the unit value; it does not change or compress an uploaded file.</span></div>
    </section>
  );
}
