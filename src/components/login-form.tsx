"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Radio, MapPin, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Brand } from "./brand";
export function LoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [show, setShow] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try { const result = await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirect: false });
      if (result?.error) setError("E-mail ou senha incorretos."); else { router.push("/"); router.refresh(); }
    } catch { setError("Não foi possível conectar. Tente novamente."); } finally { setBusy(false); }
  }
  return <div className="login-page"><section className="login-story"><Brand light/><div className="login-copy"><h1>Cada lote.<br/>No lugar certo.</h1><p>Visibilidade do recebimento à expedição.<br/>Seu estoque conectado, com um toque.</p><div className="login-visual"><div className="signal-ring ring-one"/><div className="signal-ring ring-two"/><div className="signal-ring ring-three"/><div className="signal-center"><Radio size={58}/></div><span className="floating-label label-one"><MapPin size={16}/>Zona A · Recebimento</span><span className="floating-label label-two"><ShieldCheck size={16}/>Rastreabilidade em cada etapa</span></div></div><small>CTMAQ · Logística e Almoxarifado Industrial</small></section><section className="login-form-section"><div className="login-form-wrap"><div className="login-mobile-brand"><Brand/></div><h2>Bom ter você por aqui.</h2><p>Acesse sua conta para acompanhar a operação.</p><form onSubmit={submit}><label>E-mail<input name="email" type="email" placeholder="seu@email.com" required autoComplete="username"/></label><label>Senha<div className="password-field"><input name="password" type={show ? "text" : "password"} placeholder="Digite sua senha" required autoComplete="current-password"/><button type="button" aria-label={show ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShow(!show)}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button primary login-submit" disabled={busy}>{busy ? "Entrando..." : "Entrar no painel"}<ArrowRight size={18}/></button></form>{demo && <div className="demo-notice"><strong>Ambiente de demonstração</strong><span>Os dados são salvos neste computador. Use as credenciais locais indicadas no README.</span></div>}<div className="login-security"><ShieldCheck size={15}/>Acesso exclusivo para supervisores autorizados</div></div></section></div>;
}
