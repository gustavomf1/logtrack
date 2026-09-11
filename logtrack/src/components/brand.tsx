import { Radio } from "lucide-react";
export function Brand({ light = false }: { light?: boolean }) {
  return <div className={"brand " + (light ? "light" : "")}><span className="brand-symbol"><Radio size={24}/></span><span>LogTrack<span className="brand-dot">.</span></span></div>;
}
