import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { USER } from '../domain/User';
import { AppConfigService } from './app-config.service';
import { Router } from '@angular/router';
// Inside your service or component
declare var appConfig;
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userRole: any;
  userName: any;
  constructor(public route: Router,public http: HttpClient, public config: AppConfigService) {}

  public loginUser(user: USER): Observable<USER> {
    const baseUrl = this.config.getBaseurl();
    const url = `${baseUrl}/auth/login`;
    return this.http.post<USER>(url, user);
  }
  //http://localhost:9090/auth/updatePassword=superadmin
  public updatePassword(user: USER, password: String): Observable<USER> {
    return this.http.post<USER>(
      `${this.config.getBaseurl()}/auth/updatePassword=${password}`,
      user
    );
  }

  // OTP generation method
  public generateOtp( username: string ): Observable<any> {
    const baseUrl = this.config.getBaseurl();
    const url = `${baseUrl}/auth/generate-otp/${username}`;
    return this.http.post<any>(url, null);
  }

  // Refresh/rotate token method
  public refreshToken(): Observable<any> {
    const baseUrl = this.config.getBaseurl();
    const url = `${baseUrl}/auth/refresh-token`;
    const token = localStorage.getItem('token');
    return this.http.post<any>(url, { token });
  }

  logout() {
  
    let userString = localStorage.getItem('user');
    if (userString) {
      // Step 2: Access user_role attribute
      const user = JSON.parse(userString);
      this.userRole = user.role_user;
      this.userName = user.user_email;
    }


    localStorage.setItem('user', '');
    localStorage.clear();
    if (this.userRole === 'ADMIN' || this.userRole === 'APPROVEADMIN' || this.userRole === 'SUPERADMIN') 
      { this.route.navigateByUrl('/admin'); }
     else {
      this.route.navigateByUrl('');
    }

  }

  // validateToken(token: string): Observable<boolean> {
  //   const baseUrl = this.config.getBaseurl();
  //   const url = `${baseUrl}/auth/validateToken`;
  //   return this.http.post<boolean>(url, { token });
  // }
}
