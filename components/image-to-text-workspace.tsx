"use client";

import "./image-to-text-workspace.css";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Copy, Download, FileImage, Loader2, ShieldCheck, Sparkles, UploadCloud, X } from "lucide-react";

type ProgressInfo = { status?: string; progress?: number };
const LANGUAGES = [
  { label: "English", code: "eng" }, { label: "Urdu", code: "urd" }, { label: "Arabic", code: "ara" },
  { label: "Hindi", code: "hin" }, { label: "French", code: "fra" }, { label: "Spanish", code: "spa" },
  { label: "German", code: "deu" }, { label: "Portuguese", code: "por" }, { label: "Italian", code: "ita" },
  { label: "Turkish", code: "tur" }, { label: "Russian", code: "rus" }, { label: "Chinese (Simplified)", code: "chi_sim" },
  { label: "Japanese", code: "jpn" }, { label: "Korean", code: "kor" }, { label: "Bengali", code: "ben" },
  { label: "Dutch", code: "nld" }, { label: "Polish", code: "pol" }, { label: "Thai", code: "tha" },
  { label: "Vietnamese", code: "vie" }, { label: "Indonesian", code: "ind" },
];
const MAX_BYTES = 15 * 1024 * 1024;

export function ImageToTextWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [language, setLanguage] = useState("eng");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef("");

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  function selectFile(next?: File) {
    if (!next) return;
    setError(""); setNotice(""); setResult("");
    if (!next.type.startsWith("image/")) { setError("Please choose a valid image file."); return; }
    if (next.size > MAX_BYTES) { setError("Image is larger than 15 MB. Choose a smaller image for reliable browser processing."); return; }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(next);
    previewRef.current = url; setPreview(url); setFile(next);
  }

  async function extract() {
    if (!file || busy) return;
    setBusy(true); setError(""); setNotice(""); setResult(""); setProgress(0); setStage("Starting OCR engine…");
    let worker: { recognize: (input: File) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> } | null = null;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker(language, 1, { logger: (info: ProgressInfo) => {
        if (typeof info.progress === "number") setProgress(Math.round(info.progress * 100));
        if (info.status) setStage(info.status.replace(/_/g, " "));
      } });
      const output = await worker.recognize(file);
      const text = output.data.text.trim();
      setResult(text);
      if (text) setNotice("Extraction complete. You can edit, copy, or download the recognized text.");
      else setError("No readable text was found. Try a sharper, brighter image or select the correct language.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "OCR failed. Please try another image.");
    } finally {
      if (worker) await worker.terminate().catch(() => undefined);
      setBusy(false); setStage(""); setProgress(0);
    }
  }

  async function copyResult() {
    if (!result.trim()) return;
    try { await navigator.clipboard.writeText(result); setNotice("Text copied to clipboard."); }
    catch { setError("Clipboard permission was blocked. Select the text and copy it manually."); }
  }

  function downloadResult() {
    if (!result.trim()) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${file?.name.replace(/\.[^.]+$/, "") || "brobex-extracted-text"}.txt`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }

  function clearAll() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = ""; setPreview(""); setFile(null); setResult(""); setError(""); setNotice("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="image-text-studio">
      <div className="image-text-heading">
        <div><span className="image-text-kicker"><Sparkles size={13}/> BROBEX OCR STUDIO</span><h2>Turn images into editable text.</h2><p>Extract text from screenshots, documents, notes, and photos with a private, browser-based OCR engine.</p></div>
        <span className="image-text-local"><i/> Free · Runs in your browser</span>
      </div>
      {!file ? (
        <button type="button" className="image-text-upload" onClick={() => inputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); selectFile(e.dataTransfer.files?.[0]); }}>
          <span className="image-text-upload-icon"><UploadCloud size={29}/></span><strong>Drop your image here</strong><span>or browse files from your device</span><em>JPG · PNG · WEBP · up to 15 MB</em><b>Choose Image</b>
        </button>
      ) : (
        <div className="image-text-file-panel">
          <div className="image-text-filebar"><div><FileImage size={18}/><span>{file.name}</span><small>{(file.size / 1024 / 1024).toFixed(2)} MB</small></div><button type="button" onClick={clearAll} aria-label="Remove image"><X size={17}/></button></div>
          <div className="image-text-preview"><img src={preview} alt="Selected image preview"/></div>
          <div className="image-text-controls"><label>Text language<select value={language} onChange={e => setLanguage(e.target.value)} disabled={busy}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label><button type="button" className="image-text-primary" onClick={extract} disabled={busy}>{busy ? <><Loader2 className="image-text-spin" size={16}/> Processing…</> : <><Sparkles size={16}/> Extract Text</>}</button></div>
        </div>
      )}
      <input ref={inputRef} className="image-text-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff" onChange={e => selectFile(e.target.files?.[0])}/>
      {busy && <div className="image-text-progress"><div><span>{stage || "Processing image…"}</span><b>{progress}%</b></div><div className="image-text-track"><i style={{ width: `${progress}%` }}/></div><small>First use may take longer while the free OCR language data loads.</small></div>}
      {error && <div className="image-text-alert error"><AlertCircle size={16}/>{error}</div>}
      {notice && <div className="image-text-alert success"><Check size={16}/>{notice}</div>}
      {result !== "" && <div className="image-text-result"><div className="image-text-result-head"><div><span>RECOGNIZED CONTENT</span><h3>Extracted text</h3></div><div><button type="button" onClick={copyResult}><Copy size={14}/> Copy</button><button type="button" onClick={downloadResult}><Download size={14}/> TXT</button></div></div><textarea value={result} onChange={e => setResult(e.target.value)} spellCheck={false} aria-label="Editable extracted text"/><small>Edit any OCR mistakes before copying or downloading.</small></div>}
      <div className="image-text-privacy"><ShieldCheck size={18}/><div><strong>Your image stays on your device.</strong><span>OCR is performed locally in your browser using the open-source Tesseract.js engine. No paid API key or account is required. Language data may be downloaded on first use.</span></div></div>
    </section>
  );
}
