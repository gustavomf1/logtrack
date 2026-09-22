import { Pipe, PipeTransform } from '@angular/core';
import { date } from '../../core/utils/format';

@Pipe({ name: 'datePtBr', standalone: false })
export class DatePtBrPipe implements PipeTransform {
  transform(value?: string | null): string { return date(value); }
}
