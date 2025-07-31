import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject,  interval, throwError } from 'rxjs';
import { switchMap, catchError, tap, map } from 'rxjs/operators';
import { ChatMessageDTO, ConversationDTO, PagedResponse } from '../domain/ChatMessage';
import { AppConfigService } from './app-config.service';

import { Client, Stomp, StompSubscription } from '@stomp/stompjs';
import { Subscription } from 'stompjs';

@Injectable({
  providedIn: 'root'
})
export class DepoChatService {
  private baseUrl: string;
  private messageSubject = new Subject<ChatMessageDTO>();
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private pollingSubscription: Subscription | null = null;
  private lastMessageId: number | null = null;

  //============================================================
  private stompClient: Client;
  private isConnected = false;
  private messagesSubject = new BehaviorSubject<any>(null);
  messages$ = this.messagesSubject.asObservable();
  private subscription: Subscription | null = null;
  //=============================================================

  constructor(
    private http: HttpClient,
    private config: AppConfigService,
  ) {
    this.baseUrl = `${this.config.getBaseurl()}/api/dchat`;
   }

   sendMessageViaWebSocket(message: ChatMessageDTO): void {
    this.sendMessage(message).subscribe({
      next: (response) => {
        console.log('Message sent successfully');
        // Add to our messages
        this.messageSubject.next(response);
        
        // Update last message ID
        if (response.id) {
          this.lastMessageId = response.id;
        }
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  // Get all conversations
  getAllConversations(watiIds: number[] = [0]): Observable<ConversationDTO[]> {
    const params = new HttpParams().set('watiIds', watiIds.join(','));
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/conversations`, { params });
  }

  // Get unread conversations
  getUnreadConversations(watiIds: number[] = [0]): Observable<ConversationDTO[]> {
    const params = new HttpParams().set('watiIds', watiIds.join(','));
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/conversations/unread`, { params });
  }

  // Get done conversations
  getDoneConversations(watiIds: number[] = [0]): Observable<ConversationDTO[]> {
    const params = new HttpParams().set('watiIds', watiIds.join(','));
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/conversations/done`, { params });
  }

  // Get undone conversations
  getUndoneConversations(watiIds: number[] = [0]): Observable<ConversationDTO[]> {
    const params = new HttpParams().set('watiIds', watiIds.join(','));
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/active-conversations`, { params });
  }

  getAllConversationsByUserId(userId: number): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/conversations/by-zuser/${userId}`);
  }

  getUnreadConversationsByUserId(userId: number): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/conversations/unread/user/${userId}`);
  }
  getDoneConversationsByUserId(userId: number): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/conversations/done/user/${userId}`);
  }
  getUndoneConversationsByUserId(userId: number): Observable<ConversationDTO[]> { 
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/active-conversations/by-zuser/${userId}`);
  }

  // Get conversation by watiNumber
  getConversationByWatiNumber(watiNumber: string): Observable<ConversationDTO> {
    return this.http.get<ConversationDTO>(`${this.baseUrl}/conversations/${watiNumber}`);
  }

  // Get messages by watiNumber
  getMessagesByWatiNumber(watiNumber: string): Observable<ChatMessageDTO[]> {
    return this.http.get<ChatMessageDTO[]>(`${this.baseUrl}/messages/${watiNumber}`).pipe(
      catchError(error => {
        console.error('Error fetching messages:', error);
        return [];
      }),
      tap(messages => {
        // Update the last message ID if we have messages
        if (messages && messages.length > 0) {
          const maxId = Math.max(...messages.map(m => m.id || 0));
          if (maxId > 0 && (!this.lastMessageId || maxId > this.lastMessageId)) {
            this.lastMessageId = maxId;
          }
        }
      })
    );
  }

  // Get paged messages by watiNumber
  getPagedMessagesByWatiNumber(
    watiNumber: string,
    page: number = 0,
    size: number = 20
  ): Observable<PagedResponse<ChatMessageDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<PagedResponse<ChatMessageDTO>>(
      `${this.baseUrl}/messages/${watiNumber}/paged`, 
      { params }
    )
  }

  // Send text message
  sendMessage(message: ChatMessageDTO): Observable<ChatMessageDTO> {
    return this.http.post<ChatMessageDTO>(`${this.baseUrl}/messages`, message);
  }

  // Send message with media
  sendMessageWithMedia(
    watiNumber: string,
    content: string,
    isFromUser: boolean,
    media?: File
  ): Observable<ChatMessageDTO> {
    const formData = new FormData();
    formData.append('watiNumber', watiNumber);
    formData.append('content', content);
    formData.append('isFromUser', isFromUser.toString());
    
    if (media) {
      formData.append('media', media);
    }
    
    return this.http.post<ChatMessageDTO>(`${this.baseUrl}/messages/media`, formData);
  }

  // Get media file URL
  getFileUrl(fileName: string): string {
    return `${this.baseUrl}/files/${fileName}`;
  }

  updateManualStatus(watiNumber: string, isManual: boolean): Observable<any> {
    const url = `${this.baseUrl}/conversations/${watiNumber}/manual-status`;
    const body = { 'isManual': isManual };
  
  
    return this.http.patch(url, body ).pipe(
      map((response: any) => response),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.error.message || error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  // Mark conversation as read
  markConversationAsRead(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/read`, {});
  }

  // Mark conversation as done
  markConversationAsDone(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/done`, {});
  }

  // Update client name
  updateClientName(watiNumber: string, clientId: string): Observable<ConversationDTO> {
    return this.http.patch<ConversationDTO>(`${this.baseUrl}/conversations/${watiNumber}/client-name`, { clientId });
  }

  connectdchat(watiNumber: any) {
    this.stompClient = new Client({
     brokerURL: 'wss://api.approvepanel.com/dws',
      // api.approvepanel.com/dws', // Backend WebSocket endpoint
      reconnectDelay: 5000, // Auto-reconnect after 5 seconds
    });
  
    this.stompClient.onConnect = () => {
      this.isConnected = true;
      // Update connection status
      this.connectionStatus.next(true);
  
      // ✅ Dynamic subscription to /topic/chat/{watiNumber}
     this.subscription = this.stompClient.subscribe(
        `/topic/chat/${watiNumber}`,
        (message) => {
          const data = JSON.parse(message.body);
          this.messagesSubject.next(data);
        }
      );
    };
  
    this.stompClient.onStompError = (frame) => {
      console.error('❌ STOMP Error:', frame);
      this.isConnected = false;
      this.connectionStatus.next(false);
    };
  
    this.stompClient.activate();
  }
  
  //==========================================

  disconnect() {
    if (this.stompClient) {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
      this.stompClient.deactivate();
      this.stompClient = null;
      this.connectionStatus.next(false);
    }
  
    // 🛑 Reset message subject to prevent duplicate replays
    this.messagesSubject = new BehaviorSubject<any>(null);
    this.messages$ = this.messagesSubject.asObservable();
  }
  
  
  // Get connection status observable
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Send selected bank and conversation IDs to backend
   * @param bankId The selected bank's ID
   * @param conversationId The selected conversation's ID
   * @param action Optional action type (e.g., 'message', 'qr')
   */
  sendSelectedBankAndConversation(bankId: number | string, conversationId: number | string, action?: string): Observable<any> {
    console.log(bankId);
    // TODO: Update the endpoint and payload as per backend API
    const url = `${this.baseUrl}/send-bank-conversation`;
    const body = { bankId, conversationId, action };
    return this.http.post(url, body).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Stub for request deposit operation
   */
  requestDeposit(imageMsg: any, userIdMsg: any): void {
    // TODO: Implement backend call
    console.log('Request deposit:', { imageMsg, userIdMsg });
  }

  searchConversations(searchTerm: string, filter: string, wattiAccounts: number[], userId: any): Observable<any[]> {
    // Example: return this.http.get<any[]>(`/api/conversations/search?term=${term}&filter=${filter}`);
    // Adjust params as needed for your backend
    return this.http.get<any[]>(`${this.baseUrl}/conversations/search`, {
      params: {
       searchTerm,
        // filter,
        // wattiAccounts: wattiAccounts.join(','),
        // userId
      }
    });
  }
}
