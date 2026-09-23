import { Inject, Injectable, signal } from '@angular/core';
import { API_BASE_URL } from '../config';

export type Session = { user: { name?: string | null; email?: string | null } } | null;
type LoginResponse = {
  token: string;
  expiresAt: string;
  supervisor: { id: string; nome: string; email: string };
};

const TOKEN_KEY = 'logtrack-token';
const SESSION_KEY = 'logtrack-session';
const EXPIRES_AT_KEY = 'logtrack-token-expires-at';

/**
 * Mantém a sessão do supervisor no navegador e envia o JWT emitido pelo backend Quarkus.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<Session | undefined>(undefined); // undefined = ainda não carregado

  constructor(@Inject(API_BASE_URL) private readonly base: string) {}

  async signIn(email: string, password: string): Promise<{ ok: boolean; error: string | null }> {
    const response = await fetch(this.base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.error || 'Não foi possível entrar.' };

    const login = data as LoginResponse;
    const session: Session = { user: { name: login.supervisor.nome, email: login.supervisor.email } };
    localStorage.setItem(TOKEN_KEY, login.token);
    localStorage.setItem(EXPIRES_AT_KEY, login.expiresAt);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.session.set(session);
    return { ok: true, error: null };
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(SESSION_KEY);
    this.session.set(null);
  }

  token(): string | null {
    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    if (!expiresAt || Date.parse(expiresAt) <= Date.now()) {
      void this.signOut();
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  }

  private restore(): Session {
    if (!this.token()) return null;
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as Session;
    } catch {
      void this.signOut();
      return null;
    }
  }

  async refresh(): Promise<Session> {
    const session = this.restore();
    this.session.set(session);
    return session;
  }

  async ensureLoaded(): Promise<Session> {
    if (this.session() !== undefined) return this.session()!;
    return this.refresh();
  }
}
