"use client";
import { createContext, useContext, useEffect, useState } from "react";
type Theme = "light" | "dark";
const ThemeContext = createContext<{theme: Theme; toggle: () => void}>({theme:"light",toggle:()=>{}});
export function ThemeProvider({children}:{children:React.ReactNode}) {
  const [theme,setTheme] = useState<Theme>("light");
  useEffect(()=>{ const saved=localStorage.getItem("brobex-theme") as Theme | null; const initial=saved || (matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"); setTheme(initial); document.documentElement.dataset.theme=initial; },[]);
  const toggle=()=>setTheme(current=>{const next=current==="light"?"dark":"light"; document.documentElement.dataset.theme=next; localStorage.setItem("brobex-theme",next); return next;});
  return <ThemeContext.Provider value={{theme,toggle}}>{children}</ThemeContext.Provider>;
}
export const useTheme=()=>useContext(ThemeContext);
