import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuickReply } from '../domain/QuickReply';
import { AppConfigService } from './app-config.service';

@Injectable({
  providedIn: 'root'
})
export class QuickReplyService {
  private baseUrl: string;
  private baseWUrl: string;
  constructor(
    private http: HttpClient,
    private config: AppConfigService
  ) {
    this.baseUrl = `${this.config.getBaseurl()}/api/dchat/quick-replies`;
    this.baseWUrl = `${this.config.getBaseurl()}/api/chat/quick-replies`;
  }

  // Save a new quick reply
  saveQuickReply(quickReply: QuickReply): Observable<QuickReply> {
    return this.http.post<QuickReply>(this.baseUrl, quickReply);
  }

  // Get quick replies for a specific user
  getQuickRepliesByUserId(zuserId: number): Observable<QuickReply[]> {
    return this.http.get<QuickReply[]>(`${this.baseUrl}/zuser/${zuserId}`);
  }

  deleteQuickReply(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  deleteQuickReplyw(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  saveQuickReplyw(quickReply: QuickReply): Observable<QuickReply> {
    return this.http.post<QuickReply>(this.baseUrl, quickReply);
  }

  
  getQuickRepliesByUserIdw(zuserId: number): Observable<QuickReply[]> {
    return this.http.get<QuickReply[]>(`${this.baseUrl}/${zuserId}`);
  }
}

