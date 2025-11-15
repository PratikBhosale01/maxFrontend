import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { Observable, throwError } from 'rxjs';
import { zIndex } from 'html2canvas/dist/types/css/property-descriptors/z-index';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppUserService {
  /**
   * Delete a user by id
   */
  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/auth/delete/${id}`);
  }

constructor(public http: HttpClient, private config: AppConfigService) {}
  baseUrl: String = this.config.getBaseurl();

  getUserDetails(userId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/auth/hierarchy/${userId}`
    );
  }

  getActiveUserCount(Zuser:Number):Observable<any> {
    return this.http.get<any>(
`${this.baseUrl}/auth/active-users/count/${Zuser}`);
  } 

  getBlockUserCount(Zuser:Number):Observable<any> {
    return this.http.get<any>(
`${this.baseUrl}/auth/blocked-users/count/${Zuser}`);
  }

   blockUser(userId: number): Observable<any> {
   return this.http.put<any>(
     `${this.baseUrl}/auth/blockUser/${userId}`,
     {}
   );
  }
getOtpByUsername(username: string): Observable<any> {
  if (!username) {
    return throwError(() => new Error('Username is missing')); // ✅ return an Observable
  }

  const url = `https://api.zeerosports.com/auth/show-otp/${username}`;
  return this.http.get<any>(url); 
}


logoutUser(superadmin: string, username: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/auth/admin/force-logout`, { superadmin, username });
}


  getUserActivity(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/auth/activity/${userId}`);
  }

}