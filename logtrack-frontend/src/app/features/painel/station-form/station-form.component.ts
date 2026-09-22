import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PainelDataService } from '../painel-data.service';

@Component({
  selector: 'app-station-form',
  standalone: false,
  templateUrl: './station-form.component.html',
})
export class StationFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id');
  readonly data = computed(() => this.painelData.data()!);
  readonly station = computed(() => (this.id && this.id !== 'novo' ? this.data().portais.find(c => c.id === this.id) : undefined));
  readonly hasActiveZone = computed(() => this.data().zonas.some(z => z.ativa));
  readonly zoneOptions = computed(() => this.data().zonas.filter(z => z.ativa || z.id === this.station()?.zonaId));

  readonly busy = signal(false);
  readonly error = signal('');
  readonly activation = signal('');

  constructor(
    private readonly api: ApiService,
    private readonly painelData: PainelDataService,
    private readonly router: Router,
  ) {}

  async submit(event: SubmitEvent) {
    event.preventDefault();
    this.busy.set(true); this.error.set('');
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const station = this.station();
    try {
      const result = await this.api.request<{ activationUrl?: string }>(
        'portais' + (station ? '/' + station.id : ''),
        station ? 'PATCH' : 'POST',
        { nome: form.get('nome'), ...(!station ? { zonaId: form.get('zonaId') } : {}) },
      );
      await this.painelData.refresh();
      if (result.activationUrl) this.activation.set(result.activationUrl);
      else await this.router.navigateByUrl('/portais');
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }
}
