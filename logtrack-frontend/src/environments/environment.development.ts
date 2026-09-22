/**
 * Variáveis de ambiente de DESENVOLVIMENTO (usado por `ng serve` e `--configuration development`).
 * Substitui environment.ts no build via fileReplacements (angular.json).
 */
export const environment = {
  production: false,
  /** Vazio = mesma origem; o dev server encaminha /api para http://localhost:3000 (proxy.conf.json). */
  apiBaseUrl: 'http://localhost:3000',
  /** Equivalentes a NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Vazios = tempo real desativado. */
  supabaseUrl: '',
  supabaseAnonKey: '',
  /** TEMPORÁRIO: true = usa a API simulada (src/app/core/mock/mock-backend.ts) no lugar do backend real. */
  mockApi: true,
};
