"use client";
import { useState } from "react";
import { Copy, Download, WandSparkles } from "lucide-react";
import type { ToolDefinition } from "@/types/tools";

export function WritingWorkspace({ tool }: { tool: ToolDefinition }) {
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  function run() {
    setError("");
    const prompt = input.trim();
    if (!prompt) { setError("Enter a topic or some text first."); return; }
    if (prompt.length > 12000) { setError("Please keep input under 12,000 characters."); return; }
    let result = "";
    if (tool.slug === "content-improver") {
      result = prompt.replace(/[ \t]+/g, " ").replace(/\s+([,.!?;:])/g, "$1").replace(/([.!?])([A-Z])/g, "$1 $2").replace(/\bi\b/g, "I").trim();
      if (tone === "professional") result = result.replace(/\b(kinda|sorta|stuff|things)\b/gi, (m) => ({kinda:"somewhat",sorta:"approximately",stuff:"materials",things:"items"}[m.toLowerCase()] || m));
      if (!/[.!?]$/.test(result)) result += ".";
    } else if (tool.slug === "paragraph-completer") {
      result = `${prompt.replace(/[\s.]+$/, "")}. This can be developed further by explaining the main point, providing a concrete example, and connecting the evidence back to the original idea.`;
    } else if (tool.slug === "paragraph-writer") {
      result = `${prompt.replace(/[?.!]+$/, "")} is best understood by considering its purpose, practical benefits, and real-world impact. A thoughtful approach begins with the core objective, examines the available options, and uses clear evidence to guide decisions. By focusing on useful details and measurable outcomes, readers can form a more balanced understanding and identify meaningful next steps.`;
    } else {
      const target = length === "short" ? "a concise" : length === "long" ? "a detailed" : "a balanced";
      result = `Title: ${prompt}\n\nIntroduction\n${prompt} is a useful topic to examine because it raises important questions about purpose, impact, and practical application. Understanding the main ideas provides a foundation for a clearer discussion.\n\nMain Discussion\nA ${target} analysis should consider the key arguments, relevant examples, and possible limitations. Different perspectives can help explain why the topic matters and how it affects people in real situations. Strong reasoning relies on clear explanations rather than unsupported assumptions.\n\nConclusion\nIn conclusion, ${prompt.toLowerCase()} deserves careful consideration. Reviewing the main points and applying them to specific circumstances can support better understanding and more informed decisions.`;
    }
    setOutput(result);
  }
  async function copy() { try { await navigator.clipboard.writeText(output); } catch { setError("Clipboard access was blocked. Select the output text and copy it manually."); } }
  return <div className="workspace"><div className="workspace-top"><div><span className="eyebrow">FREE OFFLINE WRITING HELPER</span><h2>{tool.name}</h2><p>This basic local helper uses templates and text cleanup. It does not call an AI model.</p></div><span className="privacy-chip"><WandSparkles size={15}/> No API key</span></div>
    <label>Topic or source text<textarea rows={7} maxLength={12000} value={input} onChange={e => setInput(e.target.value)} placeholder={tool.slug === "content-improver" ? "Paste the text you want to clean up…" : "Enter your topic, idea, or unfinished paragraph…"}/></label>
    <div className="settings-grid"><label>Tone<select value={tone} onChange={e => setTone(e.target.value)}><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="academic">Academic</option></select></label>{tool.slug === "essay-writer" && <label>Length<select value={length} onChange={e => setLength(e.target.value)}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></select></label>}</div>
    <div className="workspace-actions"><button className="button button-dark" onClick={run}>Generate draft</button><button className="button button-light" onClick={() => {setInput("");setOutput("");setError("");}}>Reset</button></div>
    {error && <p className="notice error">{error}</p>}{output && <><label>Result<textarea rows={12} value={output} onChange={e => setOutput(e.target.value)}/></label><div className="workspace-actions"><button className="button button-dark" onClick={copy}><Copy size={15}/> Copy text</button><a className="button button-light" href={`data:text/plain;charset=utf-8,${encodeURIComponent(output)}`} download={`${tool.slug}.txt`}><Download size={15}/> Download TXT</a></div><p className="hint">Review and fact-check this draft. The offline template does not provide AI-level reasoning or factual research.</p></>}
  </div>;
}
