import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

// export interface NotificationMessage {
//   id: string;
//   title: string;
//   message: string;
//   type: 'info' | 'success' | 'warning' | 'error';
//   timestamp: Date;
//   read: boolean;
// }

@Injectable({
  providedIn: 'root'
})
export class SseNotificationService {
  private notifications = new BehaviorSubject<any[]>([]);
  private isEnabled = new BehaviorSubject<boolean>(true);
  private eventSources: EventSource[] = [];
  private baseUrl = this.config.getBaseurl();
  private reconnectAttempts = new Map<string, number>();
  private maxReconnectAttempts = 3;
  private reconnectDelay = 5000; // 5 seconds

  // Get user role from localStorage or sessionStorage
  private getUserRole(): string {
    let userString = localStorage.getItem('user');
    if (!userString) {
      userString = sessionStorage.getItem('user');
    }
    if (userString) {
      const user = JSON.parse(userString);
      return user.role_user || '';
    }
    return '';
  }

  // Get endpoints based on user role
  private getEndpointsForRole(): string[] {
    const userRole = this.getUserRole();
    
    switch (userRole) {
      case 'ADMIN':
      case 'APPROVEADMIN':
      case 'SUPERADMIN':
        // Call all endpoints
        return [
          `${this.baseUrl}/notify/subscribe/with`,
          `${this.baseUrl}/notify/subscribe/depo`,
          // `${this.baseUrl}/notifydchat/messages/subscribe`,
          `${this.baseUrl}/api/notifydepochat/sse/messages/subscribe`,
          `${this.baseUrl}/notifywchat/messages/subscribe`
        ];
        
      case 'APPROVEDEPOSIT':
        // Call only deposit endpoint
        return [
          `${this.baseUrl}/notify/subscribe/depo`
        ];
        
      case 'APPROVEWITHDRAW':
        // Call only withdraw endpoint
        return [
          `${this.baseUrl}/notify/subscribe/with`
        ];
        
      case 'DEPOSITCHAT':
        // Call only deposit chat endpoint
        return [
          // `${this.baseUrl}/notifydchat/messages/subscribe`
          `${this.baseUrl}/api/notifydepochat/sse/messages/subscribe`
        ];
        
      case 'WITHDRAWCHAT':
        // Call only withdraw chat endpoint
        return [
          `${this.baseUrl}/notifywchat/messages/subscribe`
        ];
        
      default:
        // For unknown roles, return empty array (no notifications)
        console.log(`Unknown user role: ${userRole}, no notifications will be shown`);
        return [];
    }
  }

  constructor(
    private config :AppConfigService
  ) {
    
    this.requestNotificationPermission();
  }

  getNotifications(): Observable<any[]> {
    
    return this.notifications.asObservable();
  }

  getNotificationStatus(): Observable<boolean> {
    return this.isEnabled.asObservable();
  }

  toggleNotifications(): void {
    const currentStatus = this.isEnabled.value;
    if (currentStatus) {
      this.stopNotifications();
    } else {
      this.startNotifications();
    }
  }

  // Method to refresh connections (useful when user role changes)
  refreshConnections(): void {
    if (this.isEnabled.value) {
      console.log('Refreshing SSE connections for current user role');
      this.disconnectFromSSE();
      this.connectToSSE();
    }
  }

  // Public method to start notifications (called after user login)
  startNotificationsForUser(): void {
    console.log('Starting notifications for logged in user');
    this.startNotifications();
  }

  // Public method to request notification permission
  requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied' as NotificationPermission);
  }

  // Check if notifications are supported
  isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  // Get current notification permission status
  getNotificationPermission(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  private requestNotificationPermission(): void {
    if ('Notification' in window) {
      // Only request permission if it's not already granted or denied
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
          if (permission === 'granted') {
            console.log('Browser notifications enabled');
          } else {
            console.log('Browser notifications disabled by user');
          }
        }).catch(error => {
          console.warn('Error requesting notification permission:', error);
        });
      } else {
        console.log('Notification permission already set to:', Notification.permission);
      }
    }
  }

  private startNotifications(): void {
    this.isEnabled.next(true);
    this.connectToSSE();
  }

  private stopNotifications(): void {
    this.isEnabled.next(false);
    this.disconnectFromSSE();
  }

  // private connectToSSE() {
  //   console.log(this.baseUrl + "this.baseUrl");
  //   const eventSource = new EventSource(`${this.baseUrl}/notifydchat/messages/subscribe`, { withCredentials: true });
  
  //   eventSource.onmessage = (event) => {
  //     console.log('SSE Message:', event.data);
  //   };
  
  //   eventSource.onerror = (err) => {
  //     console.error('SSE Error:', err);
  //     eventSource.close();
  //     setTimeout(() => {
  //       console.log('Reconnecting SSE...');
  //       this.connectToSSE();
  //     }, 5000);
  //   };
  // }

  private connectToSSE(): void {
    let connectedEndpoints = 0;
    
    // Get endpoints based on user role
    const endpoints = this.getEndpointsForRole();
    
    if (endpoints.length === 0) {
      console.log('No endpoints available for current user role');
      return;
    }
    
    console.log(`Connecting to ${endpoints.length} endpoints for role: ${this.getUserRole()}`);
    
    // Connect to role-specific SSE endpoints
    endpoints.forEach((endpoint, index) => {
      this.createEventSource(endpoint, index);
    });
  }

  private createEventSource(endpoint: string, index: number): void {
    try {
      const eventSource = new EventSource(endpoint, { withCredentials: true });
      
      eventSource.onmessage = (event) => {
        console.log(`SSE Message from endpoint ${index + 1}:`, event.data);
        this.handleNotification(event.data, `Endpoint ${index + 1}`);
      };

      eventSource.onerror = (error) => {
        console.error(`SSE Error from endpoint ${index + 1}:`, error);
        eventSource.close();
        this.handleConnectionError(endpoint, index);
      };

      eventSource.onopen = () => {
        console.log(`Successfully connected to endpoint ${index + 1}: ${endpoint}`);
        this.reconnectAttempts.delete(endpoint);
      };

      this.eventSources.push(eventSource);
    } catch (error) {
      console.error(`Failed to create EventSource for endpoint ${index + 1}:`, error);
      this.handleConnectionError(endpoint, index);
    }
  }

  private handleConnectionError(endpoint: string, index: number): void {
    const attempts = this.reconnectAttempts.get(endpoint) || 0;
    
    if (attempts < this.maxReconnectAttempts && this.isEnabled.value) {
      console.log(`Attempting to reconnect to endpoint ${index + 1} (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts.set(endpoint, attempts + 1);
      
      setTimeout(() => {
        this.createEventSource(endpoint, index);
      }, this.reconnectDelay);
    } else if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for endpoint ${index + 1}`);
    }
  }

  private disconnectFromSSE(): void {
    console.log('Disconnecting from SSE endpoints');
    this.eventSources.forEach(eventSource => {
      eventSource.close();
    });
    this.eventSources = [];
    this.reconnectAttempts.clear();
  }



  private handleNotification(data: any, source: string): void {
    try {
      // Parse the notification message
      const parsedData = this.parseNotificationMessage(data);
      
      const notification: any = {
        id: this.generateId(),
        title: parsedData.title || 'New Notification',
        message: parsedData.message || data,
        type: parsedData.type || 'info',
        timestamp: new Date(),
        read: false,
        source: source
      };

      // Add to notifications list (limit to last 100 notifications to prevent memory issues)
      const currentNotifications = this.notifications.value;
      const updatedNotifications = [notification, ...currentNotifications].slice(0, 100);
      this.notifications.next(updatedNotifications);
      
      // Play notification sound only if notifications are enabled
      if (this.isEnabled.value) {
        this.playNotificationSound();
        this.showBrowserNotification(notification);
      }
    } catch (error) {
      console.error('Error handling notification:', error, data);
    }
  }

  private parseNotificationMessage(message: any) {
    try {
      // Handle both string and object inputs
      let parsed;
      if (typeof message === 'string') {
        parsed = JSON.parse(message);
      } else {
        parsed = message;
      }
  
      return {
        title: parsed.title || parsed.subject || 'New Notification',
        message: parsed.message || parsed.body || parsed.content || message,
        type: parsed.type || parsed.category || 'info'
      };
    } catch (err) {
      console.error('Failed to parse notification message:', err, message);
  
      // Fallback if it's not valid JSON
      return {
        title: 'New Notification',
        message: typeof message === 'string' ? message : JSON.stringify(message),
        type: 'info'
      };
    }
  }

  private playNotificationSound(): void {
    try {
      const audio = new Audio('assets/542043_6856600-lq.mp3');
      audio.volume = 0.6;
      audio.play().catch((error) => {
        console.warn('Could not play notification sound:', error);
      });
    } catch (error) {
      console.warn('Error creating audio element:', error);
    }
  }

  private showBrowserNotification(notification: any): void {
    if ('Notification' in window && Notification.permission === 'granted' && this.isEnabled.value) {
      try {
        // Default icon
        const iconPath = '/assets/notification.png';
    
        // Title emoji based on type
        let titlePrefix = '';
        switch (notification.type) {
          case 'withdrawChat':
            titlePrefix = '💸 Withdraw Chat';
            break;
          case 'depositChat':
            titlePrefix = '💰 Deposit Chat';
            break;
          case 'approveDeposit':
            titlePrefix = '✅ Deposit Approved';
            break;
          case 'approveWithdraw':
            titlePrefix = '🆗 Withdraw Approved';
            break;
          case 'success':
            titlePrefix = '✅ Success';
            break;
          case 'warning':
            titlePrefix = '⚠️ Warning';
            break;
          case 'error':
            titlePrefix = '❌ Error';
            break;
          default:
            titlePrefix = '📢 Notification';
        }
    
        // Make title pop (uppercase + emoji)
        const bigTitle = `${titlePrefix.toUpperCase()}`;
    
        // Message on a second line for visual hierarchy
        const bodyText = `\n${notification.message}`;
    
        const browserNotification = new Notification(bigTitle, {
          body: bodyText,
          icon: iconPath,
          tag: notification.id,
          requireInteraction: false,
          silent: false
        });
    
        browserNotification.onclick = () => {
          this.markAsRead(notification.id);
          browserNotification.close();
          // Focus the window
          window.focus();
        };
    
        // Auto-close after 5 seconds
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
  }
  

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  markAsRead(notificationId: string): void {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    );
    this.notifications.next(updatedNotifications);
  }

  markAllAsRead(): void {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.map(notification =>
      ({ ...notification, read: true })
    );
    this.notifications.next(updatedNotifications);
  }

  clearNotifications(): void {
    this.notifications.next([]);
  }

  getUnreadCount(): Observable<number> {
    return new Observable(observer => {
      this.notifications.subscribe(notifications => {
        const unreadCount = notifications.filter(n => !n.read).length;
        observer.next(unreadCount);
      });
    });
  }
}
