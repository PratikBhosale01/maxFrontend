import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

@Injectable({ providedIn: 'root' })
export class ApproveWithdrawsService {
  baseUrl: String;

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.baseUrl = this.config.getBaseurl();
  }

  /**
   * GET /approveOperation/withdraw/getApproveWithdrawsByExecutedByZuserId/{zuserId}
   * Accepts optional startDate, endDate, pageNo (default 0), pageSize (default 10), searchTerm
   */
  getApproveWithdrawsByExecutedByZuserId(
    zuserId: number,
    startDate?: string | null,
    endDate?: string | null,
    pageNo: number = 0,
    pageSize: number = 10,
    searchTerm?: string | null
  ): Observable<any> {
    let params = new HttpParams()
      .set('pageNo', (pageNo ?? 0).toString())
      .set('pageSize', (pageSize ?? 10).toString());

    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    const url = `${this.baseUrl}/approveOperation/withdraw/getApproveWithdrawsByExecutedByZuserId/${zuserId}`;
    return this.http.get<any>(url, { params });
  }

  /**
   * GET /approveOperation/withdraw/todayApprovedStats/{zuserId}
   * Returns an object: { count: number, amount: number }
   */
  getTodayApprovedStats(zuserId: number) {
    const url = `${this.baseUrl}/approveOperation/withdraw/todayApprovedStats/${zuserId}`;
    return this.http.get<{
      totalAmount: number; count: number; amount: number 
}>(url);
  }

  /**
   * GET /approveOperation/withdraw/datewiseApprovedStats/{zuserId}
   * Accepts required query params: startDate, endDate
   * Returns an object: { count: number, amount: number }
   */
  getDatewiseApprovedStats(zuserId: number, startDate: string, endDate: string) {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    const url = `${this.baseUrl}/approveOperation/withdraw/datewiseApprovedStats/${zuserId}`;
    return this.http.get<{
      totalAmount: number; count: number; amount: number 
}>(url, { params });
  }
}
