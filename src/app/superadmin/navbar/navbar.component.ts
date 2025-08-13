import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  Renderer2,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { USER } from '../../domain/User';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UpdatePasswordComponent } from '../update-password/update-password.component';
import { ComponettitleService } from '../../services/componenttitle.service';
import { AuthService } from '../../services/auth.service';
import { SseNotificationService, NotificationMessage } from '../../services/sse-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements AfterViewInit, OnInit, OnDestroy {
  title: string = 'Default Title';
  userRole: string;
  userName: string = "Username";
  @ViewChild('navbarToggler') navbarToggler!: ElementRef;
  @Input() isExpanded: boolean = false;
  @Output() toggleSidebar: EventEmitter<boolean> = new EventEmitter<boolean>();
  handleSidebarToggle = () => this.toggleSidebar.emit(!this.isExpanded);
  
  // Notification properties
  notifications: NotificationMessage[] = [];
  isNotificationsEnabled: boolean = false;
  unreadCount: number = 0;
  showNotificationDropdown: boolean = false;
  private subscriptions: Subscription[] = [];
  
  constructor(
    public route: Router, 
    private renderer: Renderer2, 
    public dialog: MatDialog, 
    private titleService: ComponettitleService,
    private authService: AuthService,
    private sseNotificationService: SseNotificationService
  ) {}
  ngOnInit(): void {
    this.titleService.currentTitle.subscribe((title) => (this.title = title));
    let userString = localStorage.getItem('user');
    if (!userString) {
      userString = sessionStorage.getItem('user');
    }
    if (userString) {
      // Step 2: Access user_role attribute
      const user = JSON.parse(userString);
      this.userRole = user.role_user;
      this.userName = user.user_email;
      console.log(user)
    }
    
    // Initialize notifications for superadmin
    this.initializeNotifications();
    this.sseNotificationService.startNotificationsForUser();
  }

  ngAfterViewInit() {
    if (this.navbarToggler && this.navbarToggler.nativeElement) {
      this.renderer.listen(this.navbarToggler.nativeElement, 'click', () => {
        // Your Bootstrap toggler code here
      });
    }
  }

  logout() {
    localStorage.setItem('user', '');
    this.route.navigateByUrl('');
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '50%';
    // dialogConfig.data = this.operations;
    console.log('in dialog');
    const dialogRef = this.dialog.open( UpdatePasswordComponent , dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  // Notification methods
  private initializeNotifications(): void {
    // Subscribe to notification status
    this.subscriptions.push(
      this.sseNotificationService.getNotificationStatus().subscribe(
        status => this.isNotificationsEnabled = status
      )
    );

    // Subscribe to notifications list
    this.subscriptions.push(
      this.sseNotificationService.getNotifications().subscribe(
        notifications => this.notifications = notifications
      )
    );

    // Subscribe to unread count
    this.subscriptions.push(
      this.sseNotificationService.getUnreadCount().subscribe(
        count => this.unreadCount = count
      )
    );
  }

  toggleNotifications(): void {
    this.sseNotificationService.toggleNotifications();
  }

  toggleNotificationDropdown(): void {
    this.showNotificationDropdown = !this.showNotificationDropdown;
  }

  closeNotificationDropdown(): void {
    this.showNotificationDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdown if clicking outside
    if (this.showNotificationDropdown) {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-controls')) {
        this.showNotificationDropdown = false;
      }
    }
  }

  markNotificationAsRead(notificationId: string): void {
    this.sseNotificationService.markAsRead(notificationId);
  }

  markAllNotificationsAsRead(): void {
    this.sseNotificationService.markAllAsRead();
  }

  clearAllNotifications(): void {
    this.sseNotificationService.clearNotifications();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
