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
          `${this.baseUrl}/notifydchat/messages/subscribe`,
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
          `${this.baseUrl}/notifydchat/messages/subscribe`
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

  private requestNotificationPermission(): void {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
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
    
    // console.log(`Connecting to ${endpoints.length} endpoints for role: ${this.getUserRole()}`);
    // debugger;
    // Connect to role-specific SSE endpoints
    endpoints.forEach((endpoint, index) => {
      try {
        const eventSource = new EventSource(endpoint);
        
        eventSource.onmessage = (event) => {
        
          this.handleNotification(event.data, `Endpoint ${index + 1}`);
        };

        eventSource.onerror = (error) => {
       
          eventSource.close();
        };

        eventSource.onopen = () => {
      
          connectedEndpoints++;
        };

        this.eventSources.push(eventSource);
      } catch (error) {
      
      }
    });

    // Log connection status
    if (connectedEndpoints === 0) {
      console.log('No SSE endpoints connected for current user role');
    } else {
      console.log(`Successfully connected to ${connectedEndpoints} endpoints`);
    }
  }

  private disconnectFromSSE(): void {
    this.eventSources.forEach(eventSource => {
      eventSource.close();
    });
    this.eventSources = [];
  }



  private handleNotification(data: any, source: string): void {
    // Parse the demo message format
    
    const parsedData = this.parseNotificationMessage(data);
    
    const notification: any = {
      id: this.generateId(),
      title: 'New Notification',
      message: parsedData.message,
      type: parsedData.type,
      timestamp: new Date(),
      read: false
    };

    // Add to notifications list
    const currentNotifications = this.notifications.value;
    this.notifications.next([notification, ...currentNotifications]);
 
    // Show browser notification
    this.showBrowserNotification(notification);
  }

  private parseNotificationMessage(message: any) {
    try {
      // Parse the incoming JSON string
      const parsed = JSON.parse(message);
  
      return {
        title: parsed.title || 'New Notification',
        message: parsed.message || '',
        type: parsed.type || ''
      };
    } catch (err) {
      console.error('Failed to parse notification message:', err, message);
  
      // Fallback if it's not valid JSON
      return {
        title: 'New Notification',
        message: message,
        type: ''
      };
    }
  }

  private showBrowserNotification(notification: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
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
        default:
          titlePrefix = notification.title || 'New Notification';
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
      };
  
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
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
