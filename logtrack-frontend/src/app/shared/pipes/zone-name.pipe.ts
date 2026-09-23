import { Pipe, PipeTransform } from '@angular/core';
import { zoneName } from '../../core/utils/format';

@Pipe({ name: 'zoneName', standalone: false })
export class ZoneNamePipe implements PipeTransform {
  transform(id: string | null, zones: { id: string; nome: string }[]): string { return zoneName(zones, id); }
}
