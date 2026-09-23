import { Component, computed } from '@angular/core';
import { PainelDataService } from '../painel-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { expiry } from '../../../core/utils/format';
import type { Zona } from '../../../core/models/types';

@Component({
  selector: 'app-overview',
  standalone: false,
  templateUrl: './overview.component.html',
})
export class OverviewComponent {
  readonly data = computed(() => this.painelData.data()!);
  readonly authenticated = computed(() => Boolean(this.auth.session()));

  readonly lots = computed(() => this.data().lotes.filter(l => !l.arquivado));
  readonly located = computed(() => this.lots().filter(l => l.zonaAtualId));
  readonly attention = computed(() => this.lots().filter(l => expiry(l.dataValidade) !== 'regular'));
  readonly activeStations = computed(() => this.data().portais.filter(c => c.ativo).length);

  readonly metrics = computed(() => [
    { label: 'No estoque', value: this.lots().length, note: 'lotes ativos', tone: 'blue' },
    { label: 'Localizados', value: this.located().length, note: 'em alguma zona', tone: 'green' },
    { label: 'Sem zona', value: this.lots().length - this.located().length, note: 'aguardando leitura', tone: 'purple' },
    { label: 'Atenção', value: this.attention().length, note: 'vencidos ou a vencer', tone: 'amber' },
  ]);

  readonly distribution = computed(() => {
    const zones: { id: string | null; nome: string }[] = [...this.data().zonas.filter(z => z.ativa).map((z: Zona) => ({ id: z.id as string | null, nome: z.nome })), { id: null, nome: 'Sem Zona' }];
    const total = this.lots().length;
    return zones.map((z, i) => {
      const count = this.lots().filter(l => l.zonaAtualId === z.id).length;
      return { ...z, count, tone: i % 4, width: total ? (count / total) * 100 : 0 };
    });
  });

  readonly recentMovements = computed(() => this.data().movimentacoes.slice(0, 4));
  readonly stockLots = computed(() => this.lots().slice(0, 5));

  constructor(private readonly painelData: PainelDataService, private readonly auth: AuthService) {}

  loteCodigo(loteId: string): string | undefined {
    return this.data().lotes.find(l => l.id === loteId)?.codigo;
  }

  portalNome(portalId: string): string | undefined {
    return this.data().portais.find(c => c.id === portalId)?.nome;
  }
}
