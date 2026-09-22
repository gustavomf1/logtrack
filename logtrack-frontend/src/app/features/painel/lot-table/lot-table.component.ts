import { Component, Input } from '@angular/core';
import type { DashboardData, Lote, Movimentacao } from '../../../core/models/types';

@Component({
  selector: 'app-lot-table',
  standalone: false,
  templateUrl: './lot-table.component.html',
})
export class LotTableComponent {
  @Input({ required: true }) lots: Lote[] = [];
  @Input({ required: true }) data!: DashboardData;
  @Input() readOnly = false;

  lastMovement(loteId: string): Movimentacao | undefined {
    return this.data.movimentacoes.find(m => m.loteId === loteId);
  }
}
