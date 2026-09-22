import { Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PainelDataService } from '../painel-data.service';

type Phase = 'idle' | 'writing' | 'saving' | 'written' | 'done';
type NDEFReaderCtor = new () => { write: (message: { records: { recordType: 'url'; data: string }[] }, options: { signal: AbortSignal }) => Promise<void> };

@Component({
  selector: 'app-tag-writer',
  standalone: false,
  templateUrl: './tag-writer.component.html',
})
export class TagWriterComponent {
  @ViewChild('dialog') dialogRef!: ElementRef<HTMLDialogElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly lot = computed(() => this.painelData.data()!.lotes.find(l => l.id === this.id)!);

  readonly url = window.location.origin + '/l/' + this.id;
  readonly supported = 'NDEFReader' in window && window.isSecureContext;
  readonly phase = signal<Phase>('idle');
  readonly error = signal('');
  private controller: AbortController | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly painelData: PainelDataService,
  ) {
    effect(() => {
      if (this.phase() === 'writing') this.dialogRef?.nativeElement.showModal();
      else this.dialogRef?.nativeElement.close();
    });
  }

  async markWritten() {
    this.phase.set('saving'); this.error.set('');
    try {
      await this.api.request('lotes/' + this.id + '/gravar-tag', 'POST', {});
      this.phase.set('done');
      await this.painelData.refresh();
    } catch {
      this.phase.set('written');
      this.error.set('A etiqueta foi gravada, mas não foi possível salvar a confirmação. Tente salvar novamente.');
    }
  }

  async write() {
    const NDEFReader = (window as unknown as { NDEFReader?: NDEFReaderCtor }).NDEFReader;
    if (!NDEFReader || !window.isSecureContext) { this.error.set('Use Chrome no Android com RFID e acesse por HTTPS.'); return; }
    if (!this.url.startsWith('https://')) { this.error.set('Abra o sistema pelo endereço HTTPS antes de gravar a etiqueta para uso no aparelho.'); return; }
    this.error.set(''); this.phase.set('writing');
    this.controller = new AbortController();
    try {
      await new NDEFReader().write({ records: [{ recordType: 'url', data: this.url }] }, { signal: this.controller.signal });
      await this.markWritten();
    } catch (e) {
      this.phase.set('idle');
      if ((e as Error).name !== 'AbortError') this.error.set('Falha ao gravar. Verifique a permissão, o RFID e a etiqueta, e tente novamente.');
    }
  }

  cancelWrite() { this.controller?.abort(); }
}
