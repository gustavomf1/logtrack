import { Inject, Injectable } from '@angular/core';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';
import { MOVEMENT_CHANNEL, type MovementEvent } from '../models/mapa';

/**
 * Porta direta de src/lib/realtime.ts + da assinatura feita em
 * live-notifications.tsx / operational-view.tsx (mesmo canal Supabase Realtime).
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  constructor(
    @Inject(SUPABASE_URL) private readonly url: string,
    @Inject(SUPABASE_ANON_KEY) private readonly key: string,
  ) {}

  onMovement(handler: (event: MovementEvent) => void): () => void {
    if (!this.url || !this.key) return () => {};
    const supabase = createClient(this.url, this.key);
    const channel: RealtimeChannel = supabase.channel(MOVEMENT_CHANNEL);
    channel.on('broadcast', { event: 'movement' }, ({ payload }: { payload: MovementEvent }) => handler(payload)).subscribe();
    return () => { channel.unsubscribe(); };
  }
}
