import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-copy-url',
  standalone: false,
  templateUrl: './copy-url.component.html',
})
export class CopyUrlComponent {
  @Input({ required: true }) url!: string;
  readonly message = signal('');

  async copy() {
    try { await navigator.clipboard.writeText(this.url); this.message.set('Link copiado.'); }
    catch { this.message.set('Selecione o link e copie manualmente.'); }
  }

  selectAll(event: FocusEvent) { (event.currentTarget as HTMLInputElement).select(); }
}
