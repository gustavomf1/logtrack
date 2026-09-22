import { Component, ElementRef, Input, ViewChild, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import type { Lote } from '../../../core/models/types';

@Component({
  selector: 'app-delete-lot-button',
  standalone: false,
  templateUrl: './delete-lot-button.component.html',
})
export class DeleteLotButtonComponent {
  @Input({ required: true }) lot!: Lote;
  @Input() compact = false;
  @ViewChild('dialog') dialogRef!: ElementRef<HTMLDialogElement>;

  readonly busy = signal(false);
  readonly error = signal('');

  constructor(private readonly api: ApiService, private readonly router: Router) {}

  open() { this.error.set(''); this.dialogRef.nativeElement.showModal(); }
  close() { this.dialogRef.nativeElement.close(); }
  cancelDialog(event: Event) { if (this.busy()) event.preventDefault(); }

  async remove() {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    try {
      await this.api.request('lotes/' + this.lot.id, 'DELETE');
      this.close();
      await this.router.navigateByUrl('/lotes?excluido=1');
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }
}
