import { Component, Input, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { RealtimeService } from '../../../../core/services/realtime.service';
import { PainelDataService } from '../../painel-data.service';
import type { DashboardData } from '../../../../core/models/types';
import type { MapaData, MovementEvent } from '../../../../core/models/mapa';

type Highlight = { portalId: string; zonaId: string | null } | null;

@Component({
  selector: 'app-operational-view',
  standalone: false,
  templateUrl: './operational-view.component.html',
})
export class OperationalViewComponent implements OnInit, OnDestroy {
  @Input({ required: true }) mapaData!: MapaData;
  @Input({ required: true }) data!: DashboardData;

  readonly highlight = signal<Highlight>(null);
  private unsubscribe: (() => void) | null = null;

  readonly loteCounts = computed(() => new Map(this.data.zonas.map(z => [z.id, this.data.lotes.filter(l => !l.arquivado && l.zonaAtualId === z.id).length])));

  readonly zoneMarkers = computed(() => {
    const ids = [...new Set([...this.mapaData.zonas.map(z => z.zonaId), ...this.mapaData.estacoes.map(e => e.zonaId)])];
    return ids.map(zonaId => {
      const zona = this.data.zonas.find(z => z.id === zonaId);
      if (!zona) return null;
      const placed = this.mapaData.zonas.find(z => z.zonaId === zonaId);
      const anchor = this.mapaData.estacoes.find(e => e.zonaId === zonaId);
      const x = placed ? placed.x : anchor?.x;
      const y = placed ? placed.y : anchor !== undefined ? Math.max(anchor.y - 0.12, 0.03) : undefined;
      if (x === undefined || y === undefined) return null;
      return { zonaId, nome: zona.nome, x, y, count: this.loteCounts().get(zonaId) ?? 0 };
    }).filter((z): z is { zonaId: string; nome: string; x: number; y: number; count: number } => z !== null);
  });

  constructor(private readonly realtime: RealtimeService, private readonly painelData: PainelDataService) {}

  ngOnInit() {
    this.unsubscribe = this.realtime.onMovement((payload: MovementEvent) => {
      if (!this.mapaData.estacoes.some(e => e.portalId === payload.portalId)) return;
      this.highlight.set({ portalId: payload.portalId, zonaId: payload.zonaDestinoId });
      setTimeout(() => this.highlight.set(null), 5000);
      this.painelData.refresh();
    });
  }

  ngOnDestroy() { this.unsubscribe?.(); }
}
