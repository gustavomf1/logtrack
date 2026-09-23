import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
})
export class LoginComponent {
  readonly busy = signal(false);
  readonly error = signal('');
  readonly show = signal(false);
  readonly exemplo = environment.production
    ? { email: '', senha: '' }
    : { email: 'supervisor@logtrack.local', senha: 'LogTrack123!' };

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  async submit(event: SubmitEvent) {
    event.preventDefault();
    this.busy.set(true); this.error.set('');
    const form = new FormData(event.currentTarget as HTMLFormElement);
    try {
      const result = await this.auth.signIn(String(form.get('email')), String(form.get('password')));
      if (result.error) this.error.set('E-mail ou senha incorretos.');
      else await this.router.navigateByUrl('/');
    } catch { this.error.set('Não foi possível conectar. Tente novamente.'); }
    finally { this.busy.set(false); }
  }
}
