"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, ArrowUpRight, CircleHelp, LogOut, LogIn, Radio, Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";
const navigation = [{ href: "/", label: "Visão geral", icon: LayoutDashboard }];
export function Shell({ children, name }: { children: React.ReactNode; name: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = navigation.find(x => x.href === "/" ? pathname === "/" : pathname.startsWith(x.href))?.label || "Painel";
  return <div className="app-shell">
    <aside className={"sidebar " + (open ? "sidebar-open" : "")}>
      <div className="sidebar-brand"><Brand light/><button className="mobile-close icon-button" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20}/></button></div>
      <div className="workspace-label"><span className="workspace-avatar">C</span><div><strong>CTMAQ</strong><small>Logística industrial</small></div><span className="workspace-status"/></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{navigation.map(({ href, label, icon: Icon }) => <Link onClick={() => setOpen(false)} key={href} href={href} className={(href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "nav-link active" : "nav-link"}><Icon size={19}/>{label}{href === "/" && <span className="nav-active-dot"/>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="nfc-tip"><span className="tip-icon"><Radio size={20}/></span><strong>Conecte o físico ao digital.</strong><p>Uma aproximação. Seu estoque no lugar certo.</p><Link href="/ajuda">Conhecer o fluxo RFID <ArrowUpRight size={15}/></Link></div><Link className="nav-link" href="/ajuda"><CircleHelp size={19}/>Central de ajuda</Link>{name ? <button className="nav-link logout" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={18}/>Sair da conta</button> : <Link className="nav-link" href="/login"><LogIn size={18}/>Entrar</Link>}<div className="sidebar-foot">LogTrack <span>v1.0</span></div></div>
    </aside>
    {open && <button className="menu-scrim" aria-label="Fechar navegação" onClick={() => setOpen(false)}/>}
    <div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={22}/></button><span>Workspace</span><span className="crumb-divider">/</span><strong>{title}</strong></div><div className="topbar-right">{name ? <div className="profile"><span className="avatar">{name.slice(0,2).toUpperCase()}</span><div><strong>{name}</strong><small>Supervisor</small></div></div> : <Link className="button secondary" href="/login">Entrar</Link>}</div></header><main className="main-content">{children}</main><footer className="main-footer"><span>LogTrack · Rastreabilidade que acompanha sua operação.</span><span>CTMAQ / Logística e Almoxarifado</span></footer></div>
  </div>;
}
