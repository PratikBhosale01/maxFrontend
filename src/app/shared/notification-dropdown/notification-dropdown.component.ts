import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss']
})
export class NotificationDropdownComponent {
  @Input() notifications: any[] = [];
  @Input() unreadCount: number = 0;
  @Input() isVisible: boolean = false;
  
  @Output() markAsRead = new EventEmitter<string>();
  @Output() markAllAsRead = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() closeDropdown = new EventEmitter<void>();

  constructor(private router: Router) {}

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'withdrawChat':
        return 'chat';
      case 'depositChat':
        return 'chat';
      case 'approveDeposit':
        return 'check_circle';
      case 'approveWithdraw':
        return 'check_circle';
      case 'success':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'notifications';
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'withdrawChat':
      case 'depositChat':
        return 'notification-chat';
      case 'approveDeposit':
      case 'approveWithdraw':
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

  onNotificationClick(notification: any): void {
    // Mark as read first
    this.onMarkAsRead(notification.id);
    
    // Route based on notification title
    const title = notification.title;
    
    if (title === "ApproveDeposit request Received") {
      this.router.navigate(['/home/approve']);
    } else if (title === "ApproveWithdraw request Received") {
      this.router.navigate(['/home/AppvWlist']);
    } else if (title === "Withdraw Chat Received") {
      this.router.navigate(['/home/watti-chat']);
    } else if (title === "Deposit Chat Received") {
      this.router.navigate(['/home/Deposite-Chat']);
    }
    
    // Close the dropdown after navigation
    this.closeDropdown.emit();
  }

  isClickableNotification(title: string): boolean {
    const clickableTitles = [
      "ApproveDeposit request Received",
      "ApproveWithdraw request Received", 
      "Withdraw chat Received",
      "Deposit chat Received"
    ];
    return clickableTitles.includes(title);
  }
}
