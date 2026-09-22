/**
 * Variáveis de ambiente de PRODUÇÃO (usado por `ng build`, configuração padrão).
 * Em `ng serve` / `--configuration development` este arquivo é substituído por
 * environment.development.ts (ver fileReplacements em angular.json).
 */
export const environment = {
  production: true,
  /** Origem do backend Quarkus. Vazio = mesma origem, via proxy/reverse proxy. */
  apiBaseUrl: '',
  /** Equivalentes a NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Vazios = tempo real desativado. */
  supabaseUrl: '',
  supabaseAnonKey: '',
  mockApi: false,
};
