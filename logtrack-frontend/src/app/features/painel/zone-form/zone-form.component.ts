import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PainelDataService } from '../painel-data.service';

@Component({
  selector: 'app-zone-form',
  standalone: false,
  templateUrl: './zone-form.component.html',
})
export class ZoneFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id');
  readonly zone = computed(() => (this.id && this.id !== 'nova' ? this.painelData.data()?.zonas.find(z => z.id === this.id) : undefined));
  readonly busy = signal(false);
  readonly error = signal('');

  constructor(
    private readonly api: ApiService,
    private readonly painelData: PainelDataService,
    private readonly router: Router,
  ) {}

  async submit(event: SubmitEvent) {
    event.preventDefault();
    this.busy.set(true); this.error.set('');
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const zone = this.zone();
    try {
      await this.api.request('zonas' + (zone ? '/' + zone.id : ''), zone ? 'PATCH' : 'POST', { nome: form.get('nome'), descricao: form.get('descricao') });
      await this.painelData.refresh();
      await this.router.navigateByUrl('/zonas');
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }
}
