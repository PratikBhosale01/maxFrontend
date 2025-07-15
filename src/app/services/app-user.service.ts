import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { Observable } from 'rxjs';
import { zIndex } from 'html2canvas/dist/types/css/property-descriptors/z-index';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppUserService {

constructor(public http: HttpClient, private config: AppConfigService) {}
  baseUrl: String = this.config.getBaseurl();

  getUserDetails(userId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/auth/hierarchy/${userId}`
    );
  }

  getActiveUserCount(Zuser:Number):Observable<any> {
    return this.http.get<any>(
`${this.baseUrl}/auth/active-users/count`);
  } 

  getBlockUserCount(Zuser:Number):Observable<any> {
    return this.http.get<any>(
`${this.baseUrl}/auth/blocked-users/count`);
  }

   blockUser(userId: number): Observable<any> {
   return this.http.put<any>(
     `${this.baseUrl}/auth/blockUser/${userId}`,
     {}
   );
  }

  getOtpByUsername(username: string): Observable<string> {
    return this.http.get<any>(`${this.baseUrl}/auth/show-otp/${encodeURIComponent(username)}`
  )
  }
}