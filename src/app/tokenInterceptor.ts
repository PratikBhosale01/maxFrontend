import { Injectable } from '@angular/core';
import { HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpErrorResponse,
  HttpSentEvent,
  HttpHeaderResponse,
  HttpProgressEvent,
  HttpResponse,
  HttpUserEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, finalize, filter, take } from 'rxjs/operators';
// import { ICurrentUser } from './interfaces/user';
import { AuthService } from './services/auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {
     this.token = localStorage.getItem('token');
     let userString = localStorage.getItem('user');
     if (!userString) {
       userString = sessionStorage.getItem('user');
     }
     this.user = userString ? JSON.parse(userString) : null;
   }
   token :any;
   user :any;

  isRefreshingToken: boolean = false;
  tokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpSentEvent | HttpHeaderResponse | HttpProgressEvent | HttpResponse<any> | HttpUserEvent<any> | any> {
  //  console.log("intercepted request ... ");
  const excludedUrls = ['/auth/login', '/auth/BackendHealth'];

  // Check if the request URL matches any excluded URLs
  const isExcluded = excludedUrls.some((url) =>
    request.url.includes(url)
  );
  // this.token = localStorage.getItem('token');
  if (isExcluded) {
 
    return next.handle(request);
  }else{
     
        return next.handle(this.addTokenToRequest(request,localStorage.getItem('token')))
          .pipe(
            catchError(err => {
              if (err instanceof HttpErrorResponse) {
                switch ((<HttpErrorResponse>err).status) {
                  case 400:
                  // case 401: // Unauthorized - logout user
                    return <any>this.authService.logout();
                }
              } else {
                return throwError(err);
              }
            }));
          }
   
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    if (!token) {
      console.warn('Token is missing. Skipping token addition.');
      return request;
    }
    
 
    
    const modifiedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  
    // console.log('Modified Request Headers:', modifiedRequest.headers);
    return modifiedRequest;
  }

  
}
// unauth response will 401 logout 