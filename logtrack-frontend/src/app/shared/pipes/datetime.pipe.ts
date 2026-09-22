import { Pipe, PipeTransform } from '@angular/core';
import { datetime } from '../../core/utils/format';

@Pipe({ name: 'datetime', standalone: false })
export class DatetimePipe implements PipeTransform {
  transform(value?: string | null): string { return datetime(value); }
}
