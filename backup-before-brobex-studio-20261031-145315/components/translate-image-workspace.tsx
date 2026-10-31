"use client";

import "./translate-image-workspace.css";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertCircle, Check, Copy, Download, FileImage, Languages, Loader2,
  ShieldCheck, Sparkles, UploadCloud, X,
} from "lucide-react";

type OcrProgress = { status?: string; progress?: number };
type OcrWorker = { recognize: (input: File) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> };

const OCR_LANGUAGES = [
  { label: "English", code: "eng" }, { label: "Urdu", code: "urd" },
  { label: "Arabic", code: "ara" }, { label: "French", code: "fra" },
  { label: "Spanish", code: "spa" }, { label: "German", code: "deu" },
  { label: "Hindi", code: "hin" }, { label: "Chinese (Simplified)", code: "chi_sim" },
  { label: "Japanese", code: "jpn" }, { label: "Portuguese", code: "por" },
  { label: "Italian", code: "ita" }, { label: "Turkish", code: "tur" },
  { label: "Russian", code: "rus" }, { label: "Korean", code: "kor" },
];

const TARGET_LANGUAGES = [
  ["English", "en"], ["Urdu", "ur"], ["Arabic", "ar"], ["French", "fr"],
  ["Spanish", "es"], ["German", "de"], ["Hindi", "hi"], ["Chinese (Simplified)", "zh"],
  ["Japanese", "ja"], ["Portuguese", "pt"], ["Italian", "it"], ["Turkish", "tr"],
  ["Russian", "ru"], ["Korean", "ko"], ["Bengali", "bn"], ["Dutch", "nl"],
  ["Polish", "pl"], ["Thai", "th"], ["Vietnamese", "vi"], ["Indonesian", "id"],
] as const;

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_TRANSLATION_CHARS = 4500;

function decodeHtml(value: string) {
  const element = document.createElement("textarea");
  element.innerHTML = value;
  return element.value;
}

function splitText(text: string, max = 450) {
  const chunks: string[] = [];
  let remaining = text.trim();
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf("\n", max);
    if (cut < max * 0.45) cut = remaining.lastIndexOf(". ", max);
    if (cut < max * 0.45) cut = remaining.lastIndexOf(" ", max);
    if (cut < 1) cut = max;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export function TranslateImageWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [ocrLanguage, setOcrLanguage] = useState("eng");
  const [targetLanguage, setTargetLanguage] = useState("ur");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [translationBusy, setTranslationBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<OcrWorker | null>(null);
  const previewRef = useRef("");

  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    if (workerRef.current) void workerRef.current.terminate();
  }, []);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    setError(""); setNotice(""); setSourceText(""); setTranslatedText("");
    if (!next.type.startsWith("image/")) { setError("Choose a JPG, PNG, or WebP image."); return; }
    if (next.size > MAX_IMAGE_BYTES) { setError("Maximum image size is 12 MB."); return; }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(next);
    previewRef.current = url;
    setPreview(url);
    setFile(next);
  }

  async function extractText() {
    if (!file || ocrBusy) return;
    setOcrBusy(true); setProgress(0); setError(""); setNotice(""); setTranslatedText("");
    setStage("Loading OCR engine…");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(ocrLanguage, 1, {
        logger: (info: OcrProgress) => {
          if (typeof info.progress === "number") setProgress(Math.round(info.progress * 100));
          if (info.status) setStage(info.status.replace(/_/g, " "));
        },
      });
      workerRef.current = worker;
      const result = await worker.recognize(file);
      const text = result.data.text.trim();
      setSourceText(text);
      if (!text) setError("No readable text was detected. Try a clearer image or choose the correct OCR language.");
      else setNotice("Text extracted. Review or edit it before translating.");
      await worker.terminate();
      workerRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR could not process this image. Please try again.");
    } finally {
      setOcrBusy(false); setStage(""); setProgress(0);
    }
  }

  async function translateText() {
    const text = sourceText.trim();
    if (!text || translationBusy) return;
    if (text.length > MAX_TRANSLATION_CHARS) {
      setError(`For this free provider, please translate up to ${MAX_TRANSLATION_CHARS.toLocaleString()} characters at a time.`);
      return;
    }
    setTranslationBusy(true); setError(""); setNotice(""); setTranslatedText("");
    try {
      const sourceCode = OCR_LANGUAGES.find((item) => item.code === ocrLanguage)?.code === "eng"
        ? "en"
        : ({ urd: "ur", ara: "ar", fra: "fr", spa: "es", deu: "de", hin: "hi", chi_sim: "zh", jpn: "ja", por: "pt", ita: "it", tur: "tr", rus: "ru", kor: "ko" } as Record<string, string>)[ocrLanguage] || "en";
      const chunks = splitText(text);
      const output: string[] = [];
      for (let index = 0; index < chunks.length; index++) {
        setStage(`Translating part ${index + 1} of ${chunks.length}…`);
        const params = new URLSearchParams({ q: chunks[index], langpair: `${sourceCode}|${targetLanguage}` });
        const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`);
        if (!response.ok) throw new Error(`Translation service returned ${response.status}. Try again later.`);
        const data = await response.json();
        if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
          throw new Error(data.responseDetails || "The free translation service could not translate this text. Its daily quota may have been reached.");
        }
        output.push(decodeHtml(data.responseData.translatedText));
      }
      setTranslatedText(output.join("\n\n"));
      setNotice("Translation complete. Review the result before using it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed. Please try again later.");
    } finally {
      setTranslationBusy(false); setStage("");
    }
  }

  async function copyText(value: string) {
    if (!value) return;
    try { await navigator.clipboard.writeText(value); setNotice("Text copied to clipboard."); }
    catch { setError("Clipboard access was blocked by your browser. Select and copy the text manually."); }
  }

  function downloadText() {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "brobex-translated-text.txt";
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }

  function reset() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = ""; setPreview(""); setFile(null); setSourceText("");
    setTranslatedText(""); setError(""); setNotice(""); setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onInput(event: ChangeEvent<HTMLInputElement>) { chooseFile(event.target.files?.[0]); }

  return (
    <section className="translate-studio" aria-label="Translate image workspace">
      <div className="translate-studio-heading">
        <div><span className="translate-kicker"><Sparkles size={14} /> BROBEX IMAGE STUDIO</span>
          <h2>Translate text in images.</h2>
          <p>Extract text with browser-based OCR, then translate it into another language.</p>
        </div>
        <span className="translate-local-badge"><span /> Browser OCR</span>
      </div>

      {!file ? (
        <button className="translate-upload" type="button" onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]); }}>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} hidden />
          <span className="translate-upload-icon"><UploadCloud size={27} /></span>
          <strong>Upload your image</strong>
          <span>Drag and drop your image here, or browse your device</span>
          <span className="translate-upload-button">Choose image</span>
          <small>JPG, PNG or WebP · Maximum 12 MB</small>
        </button>
      ) : (
        <>
          <div className="translate-file-row"><div><FileImage size={17} /><span>{file.name}</span><small>{(file.size / 1024 / 1024).toFixed(2)} MB</small></div>
            <button type="button" className="translate-quiet-button" onClick={reset}><X size={15} /> Remove image</button></div>
          <div className="translate-image-preview"><img src={preview} alt="Selected image for text extraction" /></div>
          <div className="translate-settings">
            <label>Text language (OCR)<select value={ocrLanguage} onChange={(event) => setOcrLanguage(event.target.value)}>{OCR_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
            <label>Translate into<select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)}>{TARGET_LANGUAGES.map(([label, code]) => <option key={code} value={code}>{label}</option>)}</select></label>
          </div>
          <div className="translate-actions"><button type="button" className="translate-primary" onClick={extractText} disabled={ocrBusy || translationBusy}>{ocrBusy ? <><Loader2 className="translate-spin" size={16} /> Extracting…</> : <><Sparkles size={16} /> Extract text from image</>}</button>
            <button type="button" className="translate-quiet-button" onClick={() => inputRef.current?.click()}>Change image</button>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onInput} hidden />
          </div>
        </>
      )}

      {(ocrBusy || translationBusy) && <div className="translate-progress"><div><span>{stage}</span><span>{ocrBusy ? `${progress}%` : ""}</span></div>{ocrBusy && <div className="translate-progress-track"><span style={{ width: `${progress}%` }} /></div>}</div>}
      {error && <div className="translate-alert translate-alert-error"><AlertCircle size={17} />{error}</div>}
      {notice && <div className="translate-alert translate-alert-success"><Check size={17} />{notice}</div>}

      {sourceText !== "" && <div className="translate-results">
        <div className="translate-result-card"><div className="translate-result-title"><div><span>01 / EXTRACTED TEXT</span><h3>Original text</h3></div><button type="button" onClick={() => void copyText(sourceText)} aria-label="Copy extracted text"><Copy size={16} /> Copy</button></div>
          <textarea value={sourceText} onChange={(event) => { setSourceText(event.target.value); setTranslatedText(""); }} rows={8} aria-label="Edit extracted text" dir="auto" />
        </div>
        <div className="translate-result-card"><div className="translate-result-title"><div><span>02 / TRANSLATION</span><h3>Translated result</h3></div>{translatedText && <button type="button" onClick={() => void copyText(translatedText)}><Copy size={16} /> Copy</button>}</div>
          <textarea value={translatedText} onChange={(event) => setTranslatedText(event.target.value)} rows={8} placeholder="Your translated text will appear here…" aria-label="Translated text" dir="auto" />
          <div className="translate-actions"><button type="button" className="translate-primary" onClick={translateText} disabled={translationBusy || !sourceText.trim()}>{translationBusy ? <><Loader2 className="translate-spin" size={16} /> Translating…</> : <><Languages size={16} /> Translate text</>}</button>
            {translatedText && <button type="button" className="translate-quiet-button" onClick={downloadText}><Download size={16} /> Download TXT</button>}
          </div>
        </div>
      </div>}

      <div className="translate-privacy"><ShieldCheck size={16} /><span>Your image is processed in your browser. OCR does not upload your image. Only the extracted text is sent to the free translation provider when you choose Translate.</span></div>
      <p className="translate-provider-note">OCR engine: Tesseract.js · Translation: MyMemory free service. Free translation requests have usage limits and require an internet connection.</p>
    </section>
  );
}
