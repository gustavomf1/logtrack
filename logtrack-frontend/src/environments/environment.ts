/**
 * Variáveis de ambiente de PRODUÇÃO (usado por `ng build`, configuração padrão).
 * Em `ng serve` / `--configuration development` este arquivo é substituído por
 * environment.development.ts (ver fileReplacements em angular.json).
 */
export const environment = {
  production: true,
  /** Origem do backend Next.js (API + NextAuth). Vazio = mesma origem do frontend. */
  apiBaseUrl: '',
  /** Equivalentes a NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Vazios = tempo real desativado. */
  supabaseUrl: '',
  supabaseAnonKey: '',
  /** TEMPORÁRIO: true = usa a API simulada (src/app/core/mock/mock-backend.ts) no lugar do backend real. */
  mockApi: true,
};
