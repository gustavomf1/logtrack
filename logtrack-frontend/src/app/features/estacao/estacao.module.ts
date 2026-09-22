import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { EstacaoComponent } from './estacao.component';

const routes: Routes = [{ path: '', component: EstacaoComponent }];

@NgModule({
  declarations: [EstacaoComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class EstacaoModule {}
