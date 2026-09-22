import { Inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../config';

export class ApiError extends Error {}

/**
 * Mesmo contrato do helper `api()` de src/components/ui.tsx do projeto Next:
 * fetch("/api/" + path) com JSON, sem cache, lançando o `error` retornado pela API em caso de falha.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(@Inject(API_BASE_URL) private readonly base: string) {}

  async request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await fetch(this.base + '/api/' + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: 'no-store',
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || 'Não foi possível concluir a operação.');
    return data as T;
  }
}
