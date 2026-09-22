import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-mapa-empty-state',
  standalone: false,
  templateUrl: './mapa-empty-state.component.html',
})
export class MapaEmptyStateComponent {
  @Input() busy = false;
  @Output() uploadFile = new EventEmitter<File>();

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadFile.emit(file);
    input.value = '';
  }
}
