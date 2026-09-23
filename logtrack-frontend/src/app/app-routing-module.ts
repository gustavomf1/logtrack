import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: 'login', loadChildren: () => import('./features/auth/login.module').then(m => m.LoginModule) },
  { path: 'estacao', loadChildren: () => import('./features/estacao/estacao.module').then(m => m.EstacaoModule) },
  { path: 'l/:id', loadChildren: () => import('./features/reader/reader.module').then(m => m.ReaderModule) },
  { path: '', canActivate: [authGuard], loadChildren: () => import('./features/painel/painel.module').then(m => m.PainelModule) },
  { path: '**', loadChildren: () => import('./features/not-found/not-found.module').then(m => m.NotFoundModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
