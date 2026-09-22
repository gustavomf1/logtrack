import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-brand',
  standalone: false,
  templateUrl: './brand.component.html',
})
export class BrandComponent {
  @Input() light = false;
}
