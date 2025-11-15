import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { Observable } from 'rxjs';
import { Operation } from '../domain/operation';
import { DepositTable } from '../domain/table';

@Injectable({
  providedIn: 'root'
})
export class DepositSuperadminService {

  constructor(private http : HttpClient, private config :AppConfigService ) { }
  baseUrl: String = this.config.getBaseurl();


  getDepositdata(): Observable<DepositTable[]> {
    return this.http.get<DepositTable[]>(
      `${this.baseUrl}/approveOperation/superAdmin/apDeposit/todayApprovedCountsByZUser`
      
    )//subscribe to;
  }

  getDateDepositdata(startDate: string, endDate: string, pageSize: number , pageNumber: number): Observable<any> {
    
    let params = new HttpParams()
    .set('pageSize', pageSize.toString())
    .set('pageNumber', pageNumber.toString());
    
    
    return this.http.get<any>(
      // `${this.baseUrl}/operation/superadmin/depositsbetweenDates/${startDate}/${endDate}`,{ params }
      `${this.baseUrl}/approveOperation/superAdmin/apDeposit/dateWiseApprovedList/${startDate}/${endDate}`,{ params }
      
    )
  }

  getApprovedRejectedCountsByZUserAndDateRange(startDate: string, endDate: string): Observable<any> {
    // API expects startDate and endDate as request params
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any>(
      `${this.baseUrl}/approveOperation/superAdmin/apDeposit/approvedAndRejectedCountsByZUserAndDateRange`, { params }
    );
  }

  getDateWithdrawdata(startDate: string, endDate: string, pageSize: number , pageNumber: number): Observable<any> {
    
    let params = new HttpParams()
    .set('pageSize', pageSize.toString())
    .set('pageNumber', pageNumber.toString());
    return this.http.get<any>(
      // `${this.baseUrl}/approveOperation/superAdmin/apWithdraw/dateWiseApprovedList/${startDate}/${endDate}`,{ params } //changed here
      `${this.baseUrl}/approveOperation/superAdmin/apWithdraw/dateWiseApprovedList/${endDate}/${startDate}`,{ params } 
    )
  }

  getAllDepositdata( pageSize: number , pageNumber: number): Observable<any> {
    
    let params = new HttpParams()
    .set('pageSize', pageSize.toString())
    .set('pageNumber', pageNumber.toString());
    
    
    return this.http.get<any>(
      `${this.baseUrl}/approveOperation/superAdmin/getAllDepositsPageable`,{ params }
      
    )
  }
  getAllWithdrawdata( pageSize: number , pageNumber: number): Observable<any> {
    
    let params = new HttpParams()
    .set('pageSize', pageSize.toString())
    .set('pageNumber', pageNumber.toString());
    
    
    return this.http.get<any>(
      `${this.baseUrl}/approveOperation/superAdmin/getAllWithdrawsPageable`,{ params }
      
    )
  }

  getTodaysAllDepositdata() : Observable<any>{
    return this.http.get<any>(
      `${this.baseUrl}/operation/superadmin/totalDepositDetailsForToday`
      
    )

  }
  getTodaysAllWithdrawdata(): Observable<any>{
    return this.http.get<any>(
      `${this.baseUrl}/operation/superadmin/totalWithdrawDetailsForToday`
      
    )

  }

  getTodaysDepositSuccessdata(): Observable<any>{
    return this.http.get<any>(
      `${this.baseUrl}/operation/superadmin/totalDepositDetailsForToday/success`
      
    )

  }

  getTodaysDepositFailuredata(): Observable<any>{
    return this.http.get<any>(
      `${this.baseUrl}/operation/superadmin/totalDepositDetailsForToday/failure`
      
    )

  }

  getTodaysWithdrawFailuredata(): Observable<any>{
    return this.http.get<any>(
      `${this.baseUrl}/operation/superadmin/totalWithdrawDetailsForToday/failure`
      
    )

  }

  getTodaysWithdrawSuccessdata(): Observable<any>{
    return this.http.get<any>(
      `${this.baseUrl}/operation/superadmin/totalWithdrawDetailsForToday/success`
      
    )

  }





}
