import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ShellComponent } from './shell/shell.component';
import { OverviewComponent } from './overview/overview.component';
import { LotsComponent } from './lots/lots.component';
import { LotDetailComponent } from './lot-detail/lot-detail.component';
import { LotFormComponent } from './lot-form/lot-form.component';
import { TagWriterComponent } from './tag-writer/tag-writer.component';
import { ZonesComponent } from './zones/zones.component';
import { ZoneFormComponent } from './zone-form/zone-form.component';
import { StationsComponent } from './stations/stations.component';
import { StationFormComponent } from './station-form/station-form.component';
import { MapaPageComponent } from './mapa/mapa-page.component';
import { HelpComponent } from './help/help.component';
import { painelResolver } from './painel.resolver';

// Mesmas rotas de src/app/(painel)/[[...path]]/page.tsx (catch-all no Next), aqui como rotas
// filhas explícitas do Shell — mesma validação de caminho, feita pelo próprio roteador.
const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    resolve: { data: painelResolver },
    children: [
      { path: '', component: OverviewComponent },
      { path: 'mapa', component: MapaPageComponent },
      { path: 'ajuda', component: HelpComponent },
      { path: 'lotes', component: LotsComponent },
      { path: 'lotes/novo', component: LotFormComponent },
      { path: 'lotes/:id/editar', component: LotFormComponent },
      { path: 'lotes/:id/gravar', component: TagWriterComponent },
      { path: 'lotes/:id', component: LotDetailComponent },
      { path: 'zonas', component: ZonesComponent },
      { path: 'zonas/nova', component: ZoneFormComponent },
      { path: 'zonas/:id', component: ZoneFormComponent },
      { path: 'portais', component: StationsComponent },
      { path: 'portais/novo', component: StationFormComponent },
      { path: 'portais/:id', component: StationFormComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PainelRoutingModule {}
