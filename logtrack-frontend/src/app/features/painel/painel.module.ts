import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { PainelRoutingModule } from './painel-routing.module';
import { PainelDataService } from './painel-data.service';

import { ShellComponent } from './shell/shell.component';
import { OverviewComponent } from './overview/overview.component';
import { LotTableComponent } from './lot-table/lot-table.component';
import { LiveNotificationsComponent } from './live-notifications/live-notifications.component';
import { LotsComponent } from './lots/lots.component';
import { LotDetailComponent } from './lot-detail/lot-detail.component';
import { LotFormComponent } from './lot-form/lot-form.component';
import { TagWriterComponent } from './tag-writer/tag-writer.component';
import { ZonesComponent } from './zones/zones.component';
import { ZoneFormComponent } from './zone-form/zone-form.component';
import { StationsComponent } from './stations/stations.component';
import { StationFormComponent } from './station-form/station-form.component';
import { HelpComponent } from './help/help.component';
import { MapaPageComponent } from './mapa/mapa-page.component';
import { MapaEmptyStateComponent } from './mapa/mapa-empty-state/mapa-empty-state.component';
import { OperationalViewComponent } from './mapa/operational-view/operational-view.component';
import { ConfigViewComponent } from './mapa/config-view/config-view.component';

@NgModule({
  declarations: [
    ShellComponent, OverviewComponent, LotTableComponent, LiveNotificationsComponent,
    LotsComponent, LotDetailComponent, LotFormComponent, TagWriterComponent,
    ZonesComponent, ZoneFormComponent, StationsComponent, StationFormComponent,
    HelpComponent, MapaPageComponent, MapaEmptyStateComponent, OperationalViewComponent, ConfigViewComponent,
  ],
  imports: [SharedModule, PainelRoutingModule],
  providers: [PainelDataService],
})
export class PainelModule {}
