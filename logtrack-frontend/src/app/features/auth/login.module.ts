import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { LoginComponent } from './login.component';
import { guestGuard } from '../../core/guards/auth.guard';

const routes: Routes = [{ path: '', component: LoginComponent, canActivate: [guestGuard] }];

@NgModule({
  declarations: [LoginComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class LoginModule {}
