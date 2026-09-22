import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PainelDataService } from '../painel-data.service';
import type { Lote } from '../../../core/models/types';

@Component({
  selector: 'app-lot-form',
  standalone: false,
  templateUrl: './lot-form.component.html',
})
export class LotFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id');
  readonly lot = computed<Lote | undefined>(() => (this.id ? this.painelData.data()?.lotes.find(l => l.id === this.id) : undefined));
  readonly busy = signal(false);
  readonly error = signal('');

  constructor(
    private readonly api: ApiService,
    private readonly painelData: PainelDataService,
    private readonly router: Router,
  ) {}

  dataValidadeValue(): string {
    return this.lot()?.dataValidade?.slice(0, 10) || '';
  }

  async submit(event: SubmitEvent) {
    event.preventDefault();
    this.busy.set(true); this.error.set('');
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const lot = this.lot();
    try {
      const quantidade = form.get('quantidade');
      const result = await this.api.request<Lote>('lotes' + (lot ? '/' + lot.id : ''), lot ? 'PATCH' : 'POST', {
        codigo: form.get('codigo'),
        descricao: form.get('descricao'),
        quantidade: quantidade === '' ? null : Number(quantidade),
        dataValidade: form.get('dataValidade') || null,
      });
      await this.painelData.refresh();
      await this.router.navigateByUrl('/lotes/' + result.id + (lot ? '' : '/gravar'));
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }
}
