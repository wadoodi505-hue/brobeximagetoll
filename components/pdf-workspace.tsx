"use client";
import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, FileText, ShieldCheck, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import type { ToolDefinition } from "@/types/tools";
import { formatBytes } from "@/lib/image/process";

const MAX_BYTES = 25 * 1024 * 1024;
const implemented = new Set(["merge-pdf", "split-pdf", "jpg-to-pdf"]);

export function PdfWorkspace({ tool }: { tool: ToolDefinition }) {
  const [files, setFiles] = useState<File[]>([]);
  const [pageRange, setPageRange] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState<Blob | null>(null);
  const [outputName, setOutputName] = useState("brobex-document.pdf");
  const [outputUrl, setOutputUrl] = useState("");

  useEffect(() => () => { if (outputUrl) URL.revokeObjectURL(outputUrl); }, [outputUrl]);
  const reset = () => { setFiles([]); setError(""); setMessage(""); setOutput(null); setOutputUrl(""); };
  function selectFiles(list: FileList | null) {
    setError(""); setMessage(""); setOutput(null); setOutputUrl("");
    const next = Array.from(list || []);
    if (!next.length) return;
    if (next.some(f => f.size <= 0 || f.size > MAX_BYTES)) { setError("Each file must be non-empty and no larger than 25 MB."); return; }
    if (tool.slug === "jpg-to-pdf" && next.some(f => !["image/jpeg", "image/png"].includes(f.type))) { setError("Choose JPG or PNG images. PNG is supported as an input too."); return; }
    if (tool.slug !== "jpg-to-pdf" && next.some(f => f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf"))) { setError("Choose valid PDF files."); return; }
    if (tool.slug === "split-pdf" && next.length !== 1) { setError("Choose exactly one PDF to split."); return; }
    if (tool.slug === "merge-pdf" && next.length < 2) { setError("Choose at least two PDF files to merge."); return; }
    setFiles(next);
  }
  async function run() {
    if (!files.length) return;
    setBusy(true); setError(""); setMessage("");
    try {
      let bytes: Uint8Array;
      if (tool.slug === "merge-pdf") {
        const merged = await PDFDocument.create();
        for (const file of files) {
          const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
          const pages = await merged.copyPages(source, source.getPageIndices());
          pages.forEach(page => merged.addPage(page));
        }
        bytes = await merged.save(); setOutputName("brobex-merged.pdf");
      } else if (tool.slug === "split-pdf") {
        const source = await PDFDocument.load(await files[0].arrayBuffer());
        const indexes = parseRange(pageRange, source.getPageCount());
        if (!indexes.length) throw new Error(`Enter valid page numbers from 1 to ${source.getPageCount()}, for example 1,3-5.`);
        const split = await PDFDocument.create();
        const pages = await split.copyPages(source, indexes);
        pages.forEach(page => split.addPage(page));
        bytes = await split.save(); setOutputName("brobex-split.pdf");
      } else if (tool.slug === "jpg-to-pdf") {
        const pdf = await PDFDocument.create();
        for (const file of files) {
          const raw = new Uint8Array(await file.arrayBuffer());
          const image = file.type === "image/png" ? await pdf.embedPng(raw) : await pdf.embedJpg(raw);
          const page = pdf.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
        bytes = await pdf.save(); setOutputName("brobex-images.pdf");
      } else throw new Error("This PDF operation is not implemented in the free browser workspace yet.");
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob); setOutputUrl(url); setOutput(blob);
      setMessage(`Finished successfully. Output size: ${formatBytes(blob.size)}.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not process these files. Check that the PDF is valid and not password-protected."); }
    finally { setBusy(false); }
  }
  return <div className="workspace">
    <div className="workspace-top"><div><span className="eyebrow">FREE BROWSER WORKSPACE</span><h2>{tool.name}</h2><p>Files are processed locally in your browser. No API key is needed.</p></div><span className="privacy-chip"><ShieldCheck size={15} /> </span></div>
    {implemented.has(tool.slug) ? <>
      <label className={`dropzone ${files.length ? "has-file" : ""}`}><input type="file" multiple={tool.slug !== "split-pdf"} accept={tool.slug === "jpg-to-pdf" ? "image/jpeg,image/png" : "application/pdf,.pdf"} onChange={e => selectFiles(e.target.files)} /><FileText size={30} /><strong>{files.length ? `${files.length} file(s) selected` : tool.slug === "jpg-to-pdf" ? "Choose JPG/PNG images" : tool.slug === "merge-pdf" ? "Choose two or more PDF files" : "Choose one PDF file"}</strong><span>{files.map(f => f.name).join(" · ") || "Maximum 25 MB per file"}</span></label>
      {tool.slug === "split-pdf" && <label>Pages to extract<input value={pageRange} onChange={e => setPageRange(e.target.value)} placeholder="Example: 1,3-5" /><small>Use page numbers separated by commas and ranges.</small></label>}
      <div className="workspace-actions"><button className="button button-dark" onClick={run} disabled={busy || !files.length}>{busy ? "Processing…" : tool.slug === "merge-pdf" ? "Merge PDFs" : tool.slug === "split-pdf" ? "Extract pages" : "Create PDF"}</button><button className="button button-light" onClick={reset}><RotateCcw size={15} /> Reset</button></div>
      {output && outputUrl && <a className="button button-dark download-button" href={outputUrl} download={outputName}><Download size={16} /> Download {outputName}</a>}
      {message && <p className="notice success"><CheckCircle2 size={16} />{message}</p>}{error && <p className="notice error"><AlertCircle size={16} />{error}</p>}
    </> : <div className="integration-notice"><span className="integration-icon">✳</span><div><h3>Not yet implemented</h3><p>This tool needs a real document renderer or conversion engine. It is intentionally not presented as working until it can produce a valid output.</p><p className="hint">No paid API is required for every PDF operation, but PDF-to-Word and high-fidelity editing require more than simple PDF page copying.</p></div></div>}
  </div>;
}
function parseRange(value: string, count: number): number[] {
  const set = new Set<number>();
  for (const part of value.split(",").map(s => s.trim()).filter(Boolean)) {
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) { const start = Number(range[1]), end = Number(range[2]); if (start < 1 || end < start || end > count) return []; for (let p = start; p <= end; p++) set.add(p - 1); }
    else if (/^\d+$/.test(part)) { const p = Number(part); if (p < 1 || p > count) return []; set.add(p - 1); }
    else return [];
  }
  return [...set].sort((a, b) => a - b);
}
