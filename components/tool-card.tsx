import Link from "next/link";
import { ArrowUpRight, Image as ImageIcon, WandSparkles, FileText, FileVideo, FileCog, PenLine } from "lucide-react";
import type { ToolDefinition } from "@/types/tools";
const icons:Record<string,typeof ImageIcon>={Image:ImageIcon,WandSparkles,FileText,FileVideo,FileCog,PenLine};
export function ToolCard({tool}:{tool:ToolDefinition}){const Icon=tool.icon in icons?icons[tool.icon]:tool.status==="browser"?ImageIcon:WandSparkles;return <Link className="tool-card" href={`/tools/${tool.slug}`}><span className="tool-icon"><Icon size={19} strokeWidth={1.7}/></span><span className="tool-card-copy"><span className="tool-name">{tool.name}</span><span className="tool-description">{tool.description}</span><span className={`status ${tool.status}`}>{tool.status==="browser"?"Ready to Use":"Integration Required"}</span></span><ArrowUpRight className="card-arrow" size={17}/></Link>}
