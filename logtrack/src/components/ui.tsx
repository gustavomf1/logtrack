import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, PackageOpen } from "lucide-react";

export function PageTitle({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading"><div><h1>{title}</h1><p>{description}</p></div><div className="heading-actions">{children}</div></div>;
}
export function Back({ href = "/lotes", children = "Voltar para lotes" }: { href?: string; children?: ReactNode }) {
  return <Link className="back-link" href={href}><ArrowLeft size={16}/>{children}</Link>;
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty-state"><PackageOpen size={32}/><p>{children}</p></div>;
}
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch("/api/" + path, { method, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
  return data as T;
}
