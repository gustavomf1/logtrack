import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

/**
 * Reflete a checagem feita em src/app/(painel)/[[...path]]/page.tsx: sem sessão de supervisor,
 * redireciona para /estacao quando o aparelho já tem uma estação vinculada (via GET /api/estacao),
 * ou para /login caso contrário.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);
  const session = await auth.ensureLoaded();
  if (session) return true;
  const isRoot = state.url.split('?')[0] === '/';
  if (isRoot) {
    try {
      const estacao = await api.request<{ vinculada: boolean }>('estacao');
      if (estacao.vinculada) return router.parseUrl('/estacao');
    } catch { /* sem estação vinculada, segue para login */ }
  }
  return router.parseUrl('/login');
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = await auth.ensureLoaded();
  return session ? router.parseUrl('/') : true;
};
