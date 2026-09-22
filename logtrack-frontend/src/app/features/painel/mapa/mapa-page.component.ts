import { Component, Inject, OnInit, computed, signal } from '@angular/core';
import { ApiService, ApiError } from '../../../core/services/api.service';
import { PainelDataService } from '../painel-data.service';
import { API_BASE_URL } from '../../../core/config';

@Component({
  selector: 'app-mapa-page',
  standalone: false,
  templateUrl: './mapa-page.component.html',
})
export class MapaPageComponent implements OnInit {
  readonly mode = signal<'operacional' | 'configuracao'>('operacional');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly loading = signal(true);

  readonly data = computed(() => this.painelData.data()!);
  readonly mapaData = computed(() => this.painelData.mapaData());

  constructor(
    private readonly api: ApiService,
    private readonly painelData: PainelDataService,
    @Inject(API_BASE_URL) private readonly base: string,
  ) {}

  ngOnInit() {
    this.painelData.refreshMapa().finally(() => this.loading.set(false));
  }

  async upload(file: File) {
    this.busy.set(true); this.error.set('');
    try {
      const form = new FormData();
      form.append('planta', file);
      const response = await fetch(this.base + '/api/mapa/planta', { method: 'POST', body: form, credentials: 'include' });
      const result = await response.json();
      if (!response.ok) throw new ApiError(result.error || 'Não foi possível enviar a imagem.');
      await this.painelData.refreshMapa();
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }

  onSaved() { this.painelData.refresh(); }
}
