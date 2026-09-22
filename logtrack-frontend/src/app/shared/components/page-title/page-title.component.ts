import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-title',
  standalone: false,
  templateUrl: './page-title.component.html',
})
export class PageTitleComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
}
