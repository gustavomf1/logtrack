export const date = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value)) : "Sem validade";
export const datetime = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "Nenhuma leitura";
export function expiry(value: string | null) {
  if (!value) return "regular";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const days = Math.ceil((Date.parse(value.slice(0, 10)) - Date.parse(today)) / 86400000);
  return days < 0 ? "vencido" : days <= 30 ? "proximo" : "regular";
}
export const zoneName = (zones: { id: string; nome: string }[], id: string | null) => zones.find(x => x.id === id)?.nome ?? "Sem Zona";
