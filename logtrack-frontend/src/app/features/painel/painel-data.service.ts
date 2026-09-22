import { Injectable, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import type { DashboardData } from '../../core/models/types';
import type { MapaData } from '../../core/models/mapa';


@Injectable()
export class PainelDataService {
  readonly data = signal<DashboardData | null>(null);
  readonly mapaData = signal<MapaData | null>(null);

  constructor(private readonly api: ApiService) {}

  async refresh(): Promise<DashboardData> {
    const data = await this.api.request<DashboardData>('painel');
    this.data.set(data);
    return data;
  }

  async refreshMapa(): Promise<MapaData | null> {
    const mapa = await this.api.request<MapaData | null>('mapa');
    this.mapaData.set(mapa);
    return mapa;
  }
}
