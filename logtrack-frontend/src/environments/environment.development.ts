/**
 * Variáveis de ambiente de DESENVOLVIMENTO (usado por `ng serve` e `--configuration development`).
 * Substitui environment.ts no build via fileReplacements (angular.json).
 */
export const environment = {
  production: false,
  /** Mesma origem; o dev server encaminha /api e /uploads para o Quarkus na porta 8080. */
  apiBaseUrl: '',
  /** Equivalentes a NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Vazios = tempo real desativado. */
  supabaseUrl: '',
  supabaseAnonKey: '',
  mockApi: false,
};
