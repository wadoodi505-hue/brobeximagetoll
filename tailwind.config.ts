import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { paper: "#F7F7F5", ink: "#171717", muted: "#737373", line: "#E5E5E5" }, boxShadow: { soft: "0 8px 30px rgba(0,0,0,.04)" } } },
  plugins: [],
};
export default config;
