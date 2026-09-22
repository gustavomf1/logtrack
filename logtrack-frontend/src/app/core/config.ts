import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Origem do backend Quarkus. Vazio = mesma origem (via proxy em dev,
 * ou build servido pelo mesmo domínio em produção). Definido em src/environments/.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});

/**
 * Equivalentes a NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY no projeto Next.
 * Vazios: as notificações em tempo real ficam inativas até serem configuradas
 * (mesmo comportamento do componente React original quando as env vars não existem).
 */
export const SUPABASE_URL = new InjectionToken<string>('SUPABASE_URL', {
  providedIn: 'root',
  factory: () => environment.supabaseUrl,
});
export const SUPABASE_ANON_KEY = new InjectionToken<string>('SUPABASE_ANON_KEY', {
  providedIn: 'root',
  factory: () => environment.supabaseAnonKey,
});
