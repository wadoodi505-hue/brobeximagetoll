"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Sun, Moon, ArrowUpRight } from "lucide-react";
import { categories } from "@/lib/tools";
import { useTheme } from "@/components/theme-provider";
export function Header() {
 const [open,setOpen]=useState(false); const {theme,toggle}=useTheme();
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[]);
 return <header className="site-header"><div className="nav-inner">
  <Link className="brand" href="/" aria-label="BROBEX Image Tools home"><span className="brand-mark">B</span><span>BROBEX<span className="brand-light">TOOLS</span></span></Link>
  <button className="mobile-menu-button" aria-label={open?"Close navigation":"Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(v=>!v)}>{open?<X size={21}/>:<Menu size={22}/>}</button>
  <nav className="desktop-nav" aria-label="Main navigation">{categories.map(c=><Link key={c.id} href={c.href}>{c.label}</Link>)}</nav>
  <div className="nav-actions"><button className="icon-button" onClick={toggle} aria-label={`Switch to ${theme==="light"?"dark":"light"} theme`}>{theme==="light"?<Moon size={18}/>:<Sun size={18}/>}</button><a className="portfolio-link" href="https://brobexportfolio.vercel.app/" target="_blank" rel="noopener noreferrer">Developer <ArrowUpRight size={15}/></a></div>
 </div><div id="mobile-navigation" className={`mobile-nav ${open?"is-open":""}`} aria-hidden={!open}>{categories.map(c=><Link key={c.id} href={c.href} onClick={()=>setOpen(false)}>{c.label}<span>↗</span></Link>)}<a href="https://brobexportfolio.vercel.app/" target="_blank" rel="noopener noreferrer" onClick={()=>setOpen(false)}>Developer portfolio ↗</a></div></header>
}
