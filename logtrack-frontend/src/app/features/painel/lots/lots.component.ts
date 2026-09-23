import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PainelDataService } from '../painel-data.service';
import { filterLots } from '../../../core/utils/filters';

@Component({
  selector: 'app-lots',
  standalone: false,
  templateUrl: './lots.component.html',
})
export class LotsComponent implements OnInit {
  readonly data = computed(() => this.painelData.data()!);
  readonly deleted = signal(false);
  readonly search = signal('');
  readonly zone = signal('');
  readonly status = signal('');

  readonly filtered = computed(() => filterLots(this.data(), new URLSearchParams({ busca: this.search(), zona: this.zone(), status: this.status() })));

  constructor(private readonly painelData: PainelDataService, private readonly route: ActivatedRoute) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.deleted.set(params.get('excluido') === '1');
    this.zone.set(params.get('zona') || '');
    this.status.set(params.get('status') || '');
    this.search.set(params.get('busca') || '');
  }
}
