import { Component, computed, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { PainelDataService } from '../painel-data.service';
import type { Zona } from '../../../core/models/types';

@Component({
  selector: 'app-zones',
  standalone: false,
  templateUrl: './zones.component.html',
})
export class ZonesComponent {
  readonly data = computed(() => this.painelData.data()!);
  readonly busy = signal(false);
  readonly error = signal('');

  constructor(private readonly api: ApiService, private readonly painelData: PainelDataService) {}

  loteCount(zonaId: string): number {
    return this.data().lotes.filter(l => !l.arquivado && l.zonaAtualId === zonaId).length;
  }

  activeStationCount(zonaId: string): number {
    return this.data().portais.filter(c => c.zonaId === zonaId && c.ativo).length;
  }

  async toggle(zone: Zona) {
    this.error.set(''); this.busy.set(true);
    try {
      await this.api.request('zonas/' + zone.id, 'PATCH', { ativa: !zone.ativa });
      await this.painelData.refresh();
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }
}
