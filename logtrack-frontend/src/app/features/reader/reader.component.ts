import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { API_BASE_URL } from '../../core/config';
import { Inject } from '@angular/core';
import type { ReadResult } from '../../core/models/types';

@Component({
  selector: 'app-reader',
  standalone: false,
  templateUrl: './reader.component.html',
})
export class ReaderComponent implements OnInit {
  readonly result = signal<ReadResult | null>(null);
  readonly error = signal('');
  private id = '';

  constructor(private readonly route: ActivatedRoute, @Inject(API_BASE_URL) private readonly base: string) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.register();
  }

  private async register() {
    const requestId = crypto.randomUUID();
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(this.base + '/api/leituras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loteId: this.id, requestId }),
          cache: 'no-store',
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Falha ao registrar leitura.');
        this.result.set(data as ReadResult);
        return;
      } catch (e) {
        if (attempt === 2) { this.error.set((e as Error).message || 'Sem conexão.'); return; }
        await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
      }
    }
  }
}
