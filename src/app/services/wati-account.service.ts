import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { map } from 'rxjs/operators';

export interface WatiAccount {
  id?: number;
  watiName: string;
  apiToken: string;
  teamId: string;
  serviceId?: string;
  isActive: boolean;
  webhookUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WatiAccountService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private configService: AppConfigService
  ) {
    this.apiUrl = `${this.configService.getBaseurl()}/api/wati-accounts`;
  }

  getAllAccounts(): Observable<WatiAccount[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(accounts => {
        // Map the API response to match our interface
        return accounts.map(account => ({
          ...account,
          isActive: Boolean(account.active) // Map 'active' to 'isActive'
        }));
      })
    );
  }

  getAccountById(id: number): Observable<WatiAccount> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(account => ({
        ...account,
        isActive: Boolean(account.active)
      }))
    );
  }

  getAccountByName(name: string): Observable<WatiAccount> {
    return this.http.get<any>(`${this.apiUrl}/name/${encodeURIComponent(name)}`).pipe(
      map(account => ({
        ...account,
        isActive: Boolean(account.active)
      }))
    );
  }

  createAccount(account: Omit<WatiAccount, 'id' | 'webhookUrl'>): Observable<WatiAccount> {
    const apiAccount = {
      ...account,
      active: account.isActive // Map 'isActive' to 'active' for API
    };
    return this.http.post<any>(this.apiUrl, apiAccount).pipe(
      map(response => ({
        ...response,
        isActive: Boolean(response.active)
      }))
    );
  }

  updateAccount(id: number, account: Partial<WatiAccount>): Observable<WatiAccount> {
    const apiAccount = {
      ...account,
      active: account.isActive // Map 'isActive' to 'active' for API
    };
    return this.http.put<any>(`${this.apiUrl}/${id}`, apiAccount).pipe(
      map(response => ({
        ...response,
        isActive: Boolean(response.active)
      }))
    );
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getActiveAccounts(): Observable<WatiAccount[]> {
    return this.http.get<WatiAccount[]>(`${this.apiUrl}/active`);
  }

  activateAccount(id: number): Observable<WatiAccount> {
    return this.http.patch<WatiAccount>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateAccount(id: number): Observable<WatiAccount> {
    return this.http.patch<WatiAccount>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  getWebhookUrl(id: number): Observable<{ webhookUrl: string }> {
    return this.http.get<{ webhookUrl: string }>(`${this.apiUrl}/${id}/webhook`);
  }
} 