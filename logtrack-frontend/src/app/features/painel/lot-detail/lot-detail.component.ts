import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PainelDataService } from '../painel-data.service';

@Component({
  selector: 'app-lot-detail',
  standalone: false,
  templateUrl: './lot-detail.component.html',
})
export class LotDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly data = computed(() => this.painelData.data()!);
  readonly lot = computed(() => this.data().lotes.find(l => l.id === this.id));
  readonly movements = computed(() => this.data().movimentacoes.filter(m => m.loteId === this.id));

  constructor(private readonly painelData: PainelDataService) {}

  portalNome(portalId: string): string | undefined {
    return this.data().portais.find(c => c.id === portalId)?.nome;
  }
}
