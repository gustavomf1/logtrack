import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app-module';
import { environment } from './environments/environment';
import { installMockBackend } from './app/core/mock/mock-backend';

if (environment.mockApi) installMockBackend();

platformBrowser().bootstrapModule(AppModule, {
  
})
  .catch(err => console.error(err));
