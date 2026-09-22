import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { PainelDataService } from './painel-data.service';
import type { DashboardData } from '../../core/models/types';

export const painelResolver: ResolveFn<DashboardData> = () => inject(PainelDataService).refresh();
