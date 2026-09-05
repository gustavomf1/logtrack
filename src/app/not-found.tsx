import Link from "next/link";
import { Brand } from "@/components/brand";
export default function NotFound() { return <div className="error-page"><Brand/><h1>Página não encontrada</h1><p>Confira o endereço ou volte ao painel.</p><Link className="button primary" href="/">Voltar ao início</Link></div>; }
