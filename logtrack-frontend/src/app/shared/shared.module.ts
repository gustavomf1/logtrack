import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  LucideArrowLeft, LucidePackageOpen, LucideRadio, LucideCheckCircle2, LucideSmartphone, LucideInfo,
  LucideLayoutDashboard, LucideArrowUpRight, LucideCircleHelp, LucideLogOut, LucideLogIn, LucideMenu, LucideX,
  LucideMap, LucideUndo2, LucideClock, LucideMapPin, LucideArrowRight, LucideShieldCheck, LucideEye, LucideEyeOff,
  LucideTrash2, LucideArrowDownLeft, LucideClock3, LucidePackage, LucidePlus, LucideSearch, LucideTag,
  LucideTriangleAlert, LucideGripVertical, LucideSave, LucideType, LucideUpload,
} from '@lucide/angular';

import { BrandComponent } from './components/brand/brand.component';
import { PageTitleComponent } from './components/page-title/page-title.component';
import { BackLinkComponent } from './components/back-link/back-link.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { CopyUrlComponent } from './components/copy-url/copy-url.component';
import { DeleteLotButtonComponent } from './components/delete-lot-button/delete-lot-button.component';

import { DatePtBrPipe } from './pipes/date-pt-br.pipe';
import { DatetimePipe } from './pipes/datetime.pipe';
import { ExpiryPipe } from './pipes/expiry.pipe';
import { ZoneNamePipe } from './pipes/zone-name.pipe';

// Cada ícone do @lucide/angular é um componente standalone (não há mais um NgModule com `.pick()`);
// eles podem ser adicionados diretamente em `imports`/`exports` de um NgModule.
const ICONS = [
  LucideArrowLeft, LucidePackageOpen, LucideRadio, LucideCheckCircle2, LucideSmartphone, LucideInfo,
  LucideLayoutDashboard, LucideArrowUpRight, LucideCircleHelp, LucideLogOut, LucideLogIn, LucideMenu, LucideX,
  LucideMap, LucideUndo2, LucideClock, LucideMapPin, LucideArrowRight, LucideShieldCheck, LucideEye, LucideEyeOff,
  LucideTrash2, LucideArrowDownLeft, LucideClock3, LucidePackage, LucidePlus, LucideSearch, LucideTag,
  LucideTriangleAlert, LucideGripVertical, LucideSave, LucideType, LucideUpload,
];

const COMPONENTS = [BrandComponent, PageTitleComponent, BackLinkComponent, EmptyStateComponent, CopyUrlComponent, DeleteLotButtonComponent];
const PIPES = [DatePtBrPipe, DatetimePipe, ExpiryPipe, ZoneNamePipe];

@NgModule({
  declarations: [...COMPONENTS, ...PIPES],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, ...ICONS],
  exports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, ...ICONS, ...COMPONENTS, ...PIPES],
})
export class SharedModule {}
