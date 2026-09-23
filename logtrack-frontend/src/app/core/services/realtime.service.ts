import { Inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../config';
import type { MovementEvent } from '../models/mapa';

/**
 * Consome GET /api/eventos (SSE) do backend Quarkus - substitui o canal Supabase
 * Realtime do projeto Next original (src/lib/realtime.ts / live-notifications.tsx /
 * operational-view.tsx). Um único EventSource por aba, compartilhado entre todos os
 * assinantes: abre na primeira chamada de onMovement, fecha quando o último cancelar.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private source: EventSource | null = null;
  private readonly handlers = new Set<(event: MovementEvent) => void>();

  constructor(@Inject(API_BASE_URL) private readonly base: string) {}

  onMovement(handler: (event: MovementEvent) => void): () => void {
    this.handlers.add(handler);
    this.ensureConnected();
    return () => {
      this.handlers.delete(handler);
      if (this.handlers.size === 0) this.disconnect();
    };
  }

  private ensureConnected() {
    if (this.source) return;
    this.source = new EventSource(this.base + '/api/eventos');
    this.source.onmessage = (message: MessageEvent<string>) => {
      let payload: MovementEvent;
      try {
        payload = JSON.parse(message.data) as MovementEvent;
      } catch {
        return; // linha malformada; nunca deve travar o stream
      }
      this.handlers.forEach(handler => handler(payload));
    };
  }

  private disconnect() {
    this.source?.close();
    this.source = null;
  }
}
