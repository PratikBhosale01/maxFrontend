import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TokenInterceptor } from './tokenInterceptor';
import { UnauthorizedInterceptor } from './unauthorized.interceptor';

// WebSocket provider token


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom(HttpClientModule),
    { provide: LocationStrategy, useClass: HashLocationStrategy }, 
    provideNativeDateAdapter(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnauthorizedInterceptor,
      multi: true,
    },
    
    // WebSocket configuration

  ],
};
