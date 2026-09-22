import { Inject, Injectable, signal } from '@angular/core';
import { API_BASE_URL } from '../config';

export type Session = { user: { name?: string | null; email?: string | null } } | null;

/**
 * Reimplementa, com fetch puro, o protocolo do cliente `next-auth/react` (signIn/signOut/getSession)
 * usado hoje pelo projeto Next — mesmas rotas: /api/auth/csrf, /api/auth/callback/credentials,
 * /api/auth/session e /api/auth/signout. Nenhuma rota nova foi criada para autenticação.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<Session | undefined>(undefined); // undefined = ainda não carregado

  constructor(@Inject(API_BASE_URL) private readonly base: string) {}

  private async csrfToken(): Promise<string> {
    const response = await fetch(this.base + '/api/auth/csrf', { credentials: 'include', cache: 'no-store' });
    const data = await response.json();
    return data.csrfToken as string;
  }

  async signIn(email: string, password: string): Promise<{ ok: boolean; error: string | null }> {
    const csrfToken = await this.csrfToken();
    const response = await fetch(this.base + '/api/auth/callback/credentials', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1' },
      body: new URLSearchParams({ email, password, csrfToken, callbackUrl: window.location.origin }),
    });
    const data = await response.json();
    const error = data.url ? new URL(data.url).searchParams.get('error') : 'Não foi possível conectar. Tente novamente.';
    const ok = response.ok && !error;
    if (ok) await this.refresh();
    return { ok, error: ok ? null : error };
  }

  async signOut(): Promise<void> {
    const csrfToken = await this.csrfToken();
    await fetch(this.base + '/api/auth/signout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1' },
      body: new URLSearchParams({ csrfToken, callbackUrl: window.location.origin }),
    });
    this.session.set(null);
  }

  async refresh(): Promise<Session> {
    const response = await fetch(this.base + '/api/auth/session', { credentials: 'include', cache: 'no-store' });
    const data = await response.json();
    const session: Session = data && data.user ? data : null;
    this.session.set(session);
    return session;
  }

  async ensureLoaded(): Promise<Session> {
    if (this.session() !== undefined) return this.session()!;
    return this.refresh();
  }
}
