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
