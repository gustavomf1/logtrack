import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ReaderComponent } from './reader.component';

const routes: Routes = [{ path: '', component: ReaderComponent }];

@NgModule({
  declarations: [ReaderComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ReaderModule {}
