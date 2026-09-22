import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-back-link',
  standalone: false,
  templateUrl: './back-link.component.html',
})
export class BackLinkComponent {
  @Input() href = '/lotes';
}
