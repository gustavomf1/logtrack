import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { RealtimeService } from '../../../core/services/realtime.service';
import { zoneName } from '../../../core/utils/format';
import { PainelDataService } from '../painel-data.service';
import type { DashboardData } from '../../../core/models/types';
import type { MovementEvent } from '../../../core/models/mapa';

type Toast = { id: string; text: string };

@Component({
  selector: 'app-live-notifications',
  standalone: false,
  templateUrl: './live-notifications.component.html',
})
export class LiveNotificationsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) data!: DashboardData;
  readonly toasts = signal<Toast[]>([]);
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly realtime: RealtimeService, private readonly painelData: PainelDataService) {}

  ngOnInit() {
    this.unsubscribe = this.realtime.onMovement((payload: MovementEvent) => {
      const current = this.painelData.data() ?? this.data;
      const codigo = current.lotes.find(l => l.id === payload.loteId)?.codigo || 'Lote';
      const text = payload.tipo === 'CANCELAMENTO'
        ? codigo + ' · movimentação cancelada, voltou para Sem Zona'
        : codigo + ' → ' + zoneName(current.zonas, payload.zonaDestinoId);
      const id = crypto.randomUUID();
      this.toasts.update(list => [...list, { id, text }]);
      setTimeout(() => this.toasts.update(list => list.filter(x => x.id !== id)), 5000);
      this.painelData.refresh();
    });
  }

  ngOnDestroy() { this.unsubscribe?.(); }
}
