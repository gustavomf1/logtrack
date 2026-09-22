import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

type EstacaoResponse = { vinculada: boolean; nome?: string; zona?: string };

@Component({
  selector: 'app-estacao',
  standalone: false,
  templateUrl: './estacao.component.html',
})
export class EstacaoComponent implements OnInit {
  readonly loading = signal(true);
  readonly station = signal<EstacaoResponse | null>(null);
  readonly erro = signal(false);
  readonly ativado = signal(false);

  constructor(private readonly api: ApiService, private readonly route: ActivatedRoute) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.erro.set(params.get('erro') !== null);
    this.ativado.set(params.get('ativado') !== null);
    if (this.erro()) { this.loading.set(false); return; }
    this.api.request<EstacaoResponse>('estacao')
      .then(result => this.station.set(result))
      .catch(() => this.station.set({ vinculada: false }))
      .finally(() => this.loading.set(false));
  }
}
