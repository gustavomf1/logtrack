"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, MapPin, Smartphone, ArrowUpRight, CircleHelp, LogOut, Radio, Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";
const navigation = [{ href: "/", label: "Visão geral", icon: LayoutDashboard }, { href: "/lotes", label: "Lotes", icon: Package }, { href: "/zonas", label: "Zonas", icon: MapPin }, { href: "/celulares", label: "Estações", icon: Smartphone }];
export function Shell({ children, name, demo }: { children: React.ReactNode; name: string; demo: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = navigation.find(x => x.href === "/" ? pathname === "/" : pathname.startsWith(x.href))?.label || "Painel";
  return <div className="app-shell">
    <aside className={"sidebar " + (open ? "sidebar-open" : "")}>
      <div className="sidebar-brand"><Brand light/><button className="mobile-close icon-button" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20}/></button></div>
      <div className="workspace-label"><span className="workspace-avatar">C</span><div><strong>CTMAQ</strong><small>Logística industrial</small></div><span className="workspace-status"/></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{navigation.map(({ href, label, icon: Icon }) => <Link onClick={() => setOpen(false)} key={href} href={href} className={(href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "nav-link active" : "nav-link"}><Icon size={19}/>{label}{href === "/" && <span className="nav-active-dot"/>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="nfc-tip"><span className="tip-icon"><Radio size={20}/></span><strong>Conecte o físico ao digital.</strong><p>Uma aproximação. Seu estoque no lugar certo.</p><Link href="/ajuda">Conhecer o fluxo NFC <ArrowUpRight size={15}/></Link></div><Link className="nav-link" href="/ajuda"><CircleHelp size={19}/>Central de ajuda</Link><button className="nav-link logout" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={18}/>Sair da conta</button><div className="sidebar-foot">LogTrack <span>v1.0</span></div></div>
    </aside>
    {open && <button className="menu-scrim" aria-label="Fechar navegação" onClick={() => setOpen(false)}/>}
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={22}/></button><span>Workspace</span><span className="crumb-divider">/</span><strong>{title}</strong></div><div className="topbar-right"><span className={"environment-pill " + (demo ? "demo-pill" : "")}><span/>{demo ? "Demonstração local" : "Ambiente de produção"}</span><div className="profile"><span className="avatar">{name.slice(0,2).toUpperCase()}</span><div><strong>{name}</strong><small>Supervisor</small></div></div></div></header><main className="main-content">{children}</main><footer className="main-footer"><span>LogTrack · Rastreabilidade que acompanha sua operação.</span><span>CTMAQ / Logística e Almoxarifado</span></footer></div>
  </div>;
}
