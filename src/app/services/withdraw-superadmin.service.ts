import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { WithdrawTable } from '../domain/table';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WithdrawSuperadminService {
  constructor(private http : HttpClient, private config :AppConfigService ) { }
  baseUrl: String = this.config.getBaseurl();


  getWithdrawdata(): Observable<WithdrawTable[]> {
    return this.http.get<WithdrawTable[]>(
      `${this.baseUrl}/operation/superadmin/withdraw/userCounts`  
    )//subscribe to;
  }

  getApprovedRejectedCountsByZUserAndDateRange(startDate: string, endDate: string): Observable<any> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(
      `${this.baseUrl}/approveOperation/superAdmin/apWithdraw/approvedAndRejectedCountsByZUserAndDateRange`, { params }
    );
  }
}
