import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OperationsPanelService {
  private baseUrl = '/api/server';

  constructor(private http: HttpClient) {}

  restartService(): Observable<any> {
    return this.http.post(`${this.baseUrl}/actuator/restart`, {});
  }

  shutdownService(): Observable<any> {
    return this.http.post(`${this.baseUrl}/shutdown`, {});
  }

  getAllServicesHealth(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/health/all`);
  }
}
