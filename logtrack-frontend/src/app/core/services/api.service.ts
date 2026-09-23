import { Inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../config';
import { AuthService } from './auth.service';

export class ApiError extends Error {}

/**
 * Mesmo contrato do helper `api()` de src/components/ui.tsx do projeto Next:
 * fetch("/api/" + path) com JSON, sem cache, lançando o `error` retornado pela API em caso de falha.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    @Inject(API_BASE_URL) private readonly base: string,
    private readonly auth: AuthService,
  ) {}

  async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const token = this.auth.token();
    const response = await fetch(this.base + '/api/' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: 'no-store',
      credentials: 'include',
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && token) await this.auth.signOut();
    if (!response.ok) throw new ApiError(data.error || 'Não foi possível concluir a operação.');
    return data as T;
  }
}
