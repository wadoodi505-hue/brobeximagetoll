"use client";
import { useMemo, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import type { ToolDefinition } from "@/types/tools";
export function ToolSearch({tools,placeholder="Search image tools..."}:{tools:ToolDefinition[];placeholder?:string}) {
 const [query,setQuery]=useState(""); const [filter,setFilter]=useState("all");
 const filtered=useMemo(()=>{const q=query.trim().toLowerCase();return tools.filter(t=>(filter==="all"||t.status===filter)&&(!q||`${t.name} ${t.description} ${t.category} ${t.slug}`.toLowerCase().includes(q)))},[tools,query,filter]);
 return <section className="search-section" aria-label="Search tools"><div className="search-box"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder} aria-label="Search by tool name, description, or category"/>{query&&<button onClick={()=>setQuery("")} aria-label="Clear search"><X size={17}/></button>}<kbd>/</kbd></div><div className="search-meta"><span>{filtered.length} {filtered.length===1?"tool":"tools"} found</span><label className="filter-label"><SlidersHorizontal size={14}/><select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filter tools"><option value="all">All tools</option><option value="browser">Browser ready</option><option value="integration">Integration required</option></select></label></div><div className="tool-grid">{filtered.map(t=><ToolCard key={t.slug} tool={t}/>)}</div>{filtered.length===0&&<div className="empty-state"><Search size={28}/><h3>No matching tools</h3><p>Try another keyword or clear the search to see all tools.</p><button className="button button-dark" onClick={()=>{setQuery("");setFilter("all")}}>Clear filters</button></div>}</section>
}
