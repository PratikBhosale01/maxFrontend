import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

 constructor(private http : HttpClient, private config :AppConfigService ) { }
  baseUrl: String = this.config.getBaseurl();

 getchatIds(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/webhook/messages/unique-waids`);
  } 

  getMessages(waIds: string[], page: number = 0): Observable<any[]> {
    // Create query parameters
    let params = new HttpParams()
      .set('waIds', waIds.join(',')) // Join array into comma-separated string
      .set('page', page.toString());

    // Make GET request
    return this.http.get<any[]>(`${this.baseUrl}/webhook/messages/last`, { params }); 
  }

  getLastAlerts(zuserID: string, page: number = 0): Observable<any[]> {
    let params = new HttpParams()
      .set('zuserId',zuserID.toString())
      .set('page', page.toString());
  
    return this.http.get<any[]>(`${this.baseUrl}/webhook/alerts/pending`, { params });
  }

  getLastAlertsAll(zuserID: string, page: number = 0): Observable<any[]> {
    let params = new HttpParams()
      .set('zuserId',zuserID.toString() )
      .set('page', page.toString());
  
    return this.http.get<any[]>(`${this.baseUrl}/webhook/alerts/last`, { params });
  }

  getAlertStatus(alertId: string, status: string): Observable<any> {
    // Create query parameters
    let params = new HttpParams()
    .set('status', status);

    // Make GET request
    return this.http.put<any>(`${this.baseUrl}/webhook/alerts/${alertId}/status?status=REMOVED`,null);
  }

  get200appvd(zuserID: string ): Observable<any>{
    let params = new HttpParams()
    .set('zuserId',zuserID.toString() )
 
    return this.http.get<any>(`${this.baseUrl}/approveOperation/getLast300DepositsByZuserId`, { params });

  }

  getBankNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/bankWebhook/NotificationsByStatuses`, {
      params: new HttpParams().set('statuses',"RECEIVED")
    });
  }

    getOtpNotifications(ZuserId : any): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/otp-notifications/device/${ZuserId}` )
    }
  /**
   * Fetch unique device names from otp-notifications service
   * Endpoint: /otp-notifications/devices/unique
   */
  getUniqueDeviceNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/otp/devices/unique-otp`);
  }

  getBankNotificationsByDevice(deviceName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/bankWebhook/by-device`, {
      params: new HttpParams().set('deviceName', deviceName)
    });
  }

  closeNotification( id: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/bankWebhook/${id}/status`,null, {
      params: new HttpParams().set('status',"ARCHIVED")
    });
  }
    closeWNotification( id: any): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/otp-notifications/delete/${id}`);
  }

  

}
