/**
 * Variáveis de ambiente de DESENVOLVIMENTO (usado por `ng serve` e `--configuration development`).
 * Substitui environment.ts no build via fileReplacements (angular.json).
 */
export const environment = {
  production: false,
  /** Mesma origem; o dev server encaminha /api e /uploads para o Quarkus na porta 8080. */
  apiBaseUrl: '',
  mockApi: false,
};
