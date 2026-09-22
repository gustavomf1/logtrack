import { Pipe, PipeTransform } from '@angular/core';
import { expiry } from '../../core/utils/format';

@Pipe({ name: 'expiry', standalone: false })
export class ExpiryPipe implements PipeTransform {
  transform(value: string | null): string { return expiry(value); }
}
