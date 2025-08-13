import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NotificationMessage } from '../../services/sse-notification.service';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent {
  @Input() notifications: NotificationMessage[] = [];
  @Input() unreadCount: number = 0;
  @Input() isVisible: boolean = false;
  
  @Output() markAsRead = new EventEmitter<string>();
  @Output() markAllAsRead = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'success':
        return 'notification-success';
      case 'warning':
        return 'notification-warning';
      case 'error':
        return 'notification-error';
      default:
        return 'notification-info';
    }
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  onMarkAsRead(notificationId: string): void {
    this.markAsRead.emit(notificationId);
  }

  onMarkAllAsRead(): void {
    this.markAllAsRead.emit();
  }

  onClearAll(): void {
    this.clearAll.emit();
  }
}
