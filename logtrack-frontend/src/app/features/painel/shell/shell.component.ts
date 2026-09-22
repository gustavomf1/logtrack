import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';

type NavItem = { href: string; label: string };

@Component({
  selector: 'app-shell',
  standalone: false,
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly navigation: NavItem[] = [
    { href: '/', label: 'Visão geral' },
    { href: '/mapa', label: 'Mapa' },
    { href: '/portais', label: 'Portais' },
  ];

  readonly open = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    { initialValue: null },
  );

  readonly pathname = computed(() => this.url()?.urlAfterRedirects.split('?')[0] ?? this.router.url.split('?')[0]);

  readonly title = computed(() => {
    const pathname = this.pathname();
    return this.navigation.find(x => (x.href === '/' ? pathname === '/' : pathname.startsWith(x.href)))?.label || 'Painel';
  });

  readonly name = computed(() => this.auth.session()?.user?.name || 'Supervisor');

  isActive(href: string): boolean {
    const pathname = this.pathname();
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  closeMenu() { this.open.set(false); }

  async logout() {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
