import { Component, computed, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { PainelDataService } from '../painel-data.service';
import type { Portal } from '../../../core/models/types';

@Component({
  selector: 'app-stations',
  standalone: false,
  templateUrl: './stations.component.html',
})
export class StationsComponent {
  readonly data = computed(() => this.painelData.data()!);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly activation = signal('');

  constructor(private readonly api: ApiService, private readonly painelData: PainelDataService) {}

  async regenerate(station: Portal) {
    this.error.set(''); this.busy.set(true);
    try {
      const result = await this.api.request<{ activationUrl?: string }>('portais/' + station.id + '/regenerar-token', 'POST', {});
      if (result.activationUrl) this.activation.set(result.activationUrl);
      await this.painelData.refresh();
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }

  async toggle(station: Portal) {
    this.error.set(''); this.busy.set(true);
    try {
      await this.api.request('portais/' + station.id, 'PATCH', { ativo: !station.ativo });
      await this.painelData.refresh();
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }
}
