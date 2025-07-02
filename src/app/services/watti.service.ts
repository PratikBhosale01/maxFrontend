import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, Subscription, interval, throwError } from 'rxjs';
import { switchMap, catchError, tap, map } from 'rxjs/operators';
import { ChatMessageDTO, ConversationDTO, PagedResponse } from '../domain/ChatMessage';
import { AppConfigService } from './app-config.service';

import { Client, Stomp, StompSubscription } from '@stomp/stompjs';



@Injectable({
  providedIn: 'root'
})
export class WattiService {
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
  private subscription: StompSubscription | null = null;
  //=============================================================
  constructor(
    private http: HttpClient,
    private config: AppConfigService,
 
  ) {
    this.baseUrl = `${this.config.getBaseurl()}/api/chat`;
    

 
  }

  convertWebmToMP3(media?: any) {
    const formData = new FormData();
  
      formData.append('file', media);
   
  
    return this.http.post(`https://api.zeerosports.com/convert/webm-to-mp3`, formData, {
      responseType: 'blob' // expecting binary data (like MP3)
    });
  }




  // Send message via WebSocket (actually via HTTP for simplicity)
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
  getAllConversations(): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/conversations`);
  }

  // Get unread conversations
  getUnreadConversations(): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/conversations/unread`);
  }

  // Get done conversations
  getDoneConversations(): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/conversations/done`);
  }

  // Get undone conversations
  getUndoneConversations(): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.baseUrl}/active-conversations`);
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

  connect(watiNumber: any) {
    this.stompClient = new Client({
      brokerURL: 'ws://api.approvepanel.com/ws', // Backend WebSocket endpoint
      reconnectDelay: 5000, //http://13.200.63.62:8080 Auto-reconnect after 5 seconds
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
} 