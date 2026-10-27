import Link from "next/link";
export default function NotFound(){return <div className="container not-found"><span className="eyebrow">404 · NOT FOUND</span><h1>This tool could not be found.</h1><p>The link may be incorrect, or the tool may have moved.</p><Link className="button button-dark" href="/">Back to Image Tools</Link></div>}
