import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ApproveService } from '../../services/approve.service';
import { debounceTime, distinctUntilChanged, interval, Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { Alert, AlertStatus,  } from '../../domain/notify';
import { SnackbarService } from '../../services/snackbar.service';
import { DepositeWithdraw } from '../../domain/Deposite';
export enum AlertType {
  USERNAMEMISSING = 'USERNAMEMISSING',
  USERNOTFOUND = 'USERNOTFOUND',
  UTRALREADYUSED = 'UTRALREADYUSED',
  REJECTEDREQUEST = 'REJECTEDREQUEST'
}
@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})

export class NotificationComponent implements OnInit, OnDestroy {

  AlertStatus = AlertStatus;
  chatOptions: string[] = []; // Array to hold unique waIds
  objects = [];
  // objects: any[] = [];
  currentPage = 0;
  isLoading = false;
  hasMoreMessages = true; // Flag to stop fetching if no more messages
  
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  
  @ViewChild('alertContainer') alertContainer!: ElementRef;
  currentPageAlert = 0;
  approveList: any[] = [];
  selectedChats = new FormControl<string[]>([]);

  private subscription: Subscription;
  private subscriptionAlert: Subscription;
  AlertType = AlertType;
  hasMorealerts: boolean;
alertSelected: boolean;
deposite: DepositeWithdraw ;
isInputActive: boolean = false;
  user: any;
  userId: any;


  constructor(  private apprvserv: ApproveService ,private notificationService: NotificationService ,
      private snackbarService: SnackbarService, private approveService: ApproveService
  ) {
    this.subscription = new Subscription();

  }
  alerts: Alert[] =[];

  onClose(alertId: string) {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.notificationService.getAlertStatus(alertId,"REMOVED").subscribe(response => {
      this.snackbarService.snackbar('Successful !!', 'success');
    
    });
  
  }

  onSubmit( alert: Alert) {
    console.log('Selected alert:', alert);
    const depositenew : DepositeWithdraw ={
      userId:alert.userId, amount: "", date: new Date().toDateString(), siteMasterId: 0, zuserId: 0, siteId: 0, bankUtrImageLink: alert.data,
      id: 0,
      utrNumber: 'NA',newId:false,chatID: alert.waId
    };
   
    this.approveService.deposite(depositenew).subscribe(
      (response) => {
        this.snackbarService.snackbar('Successful !!', 'success');
        this.onClose(alert.id);
      },
      (error) => {
        this.snackbarService.snackbar('Error occurred', 'error');
      });

  }
  ngOnInit() {
    this.getUserId();
    this.getApproveList();
    this. loadUniqueWaIds();
    this. loadalerts(this.selectedChats.value,this.currentPageAlert)   // Load chat options on component initialization
    this.fetchMessages(this.selectedChats.value, this.currentPage); // Fetch messages for selected chats
    // this.loadChatOptions(); // Load chat options on component initialization
    this.subscription = interval(2000).subscribe(() => {this.getApproveList();});
    this.startAlertRefresh();
    
    this.selectedChats.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((waIds) => {
        this.currentPage = 0; // Reset page on new selection
        this.objects = []; // Clear existing messages
        this.hasMoreMessages = true;
        if (waIds && waIds.length > 0) {
          // localStorage.setItem('chatOptions', JSON.stringify(waIds));
          this.fetchMessages(waIds, this.currentPage);
          this.loadalerts(waIds, this.currentPageAlert);
        }
      });
  
  }

  getUserId(){
    let userData = localStorage.getItem('user');
    if (!userData) {
      userData = sessionStorage.getItem('user');
    }
    if (userData) {
      this.user = JSON.parse(userData);
      this.userId = this.user.user_id;  // Get the user ID from storage
    } else {
      // Handle the case when user data is not available
      console.error('User data not found in localStorage or sessionStorage');
      return;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe(); // Unsubscribe from the interval when the component is destroyed
    if (this.subscriptionAlert) {
      this.subscriptionAlert.unsubscribe(); // Unsubscribe from the interval when the component is destroyed
    }
  }

  // Methods to pause/resume alert refresh
  setInputActive(status: boolean) {
    this.isInputActive = status;
    if (status) {
      this.stopAlertRefresh();
    } else {
      this.startAlertRefresh();
    }
  }

  stopAlertRefresh() {
    if (this.subscriptionAlert) {
      this.subscriptionAlert.unsubscribe();
    }
  }

  startAlertRefresh() {
    // First unsubscribe if already subscribed to avoid multiple subscriptions
    if (this.subscriptionAlert) {
      this.subscriptionAlert.unsubscribe();
    }
    this.subscriptionAlert = interval(2000).subscribe(() => {
      if (!this.isInputActive) {
        this.loadalerts(this.selectedChats.value, this.currentPageAlert);
      }
    });
  }

  onCheckboxChange(isSelected: boolean) {
    if (isSelected) {
      // Call select endpoint
      this.notificationService.getLastAlertsAll(this.userId , this.currentPageAlert).subscribe({
        next: (response) => {
          this.alerts = response;
          this.alertSelected = true; // Ensure boolean reflects checked state
        },
        error: (error) => console.error('Select endpoint error:', error)
      });
    } else {
      // Call deselect endpoint
      this.notificationService.getLastAlerts(this.userId , this.currentPageAlert).subscribe({
        next: (response) => {
          this.alerts = response;
          this.alertSelected = false; // Ensure boolean reflects unchecked state
        },
        error: (error) => console.error('Deselect endpoint error:', error)
      });
    }
  }

  loadUniqueWaIds() {
    this.isLoading = true;
    this.notificationService.getchatIds().subscribe({
      next: (waIds) => {
        this.chatOptions = waIds;
        console.log('Unique waIds:', this.chatOptions);
        this.isLoading = false;
      },
      error: (err) => {
        
        console.error('Error fetching unique waIds:', err);
        this.isLoading = false;
      }
    });
  }
  loadalerts(waIds: string[], page: number) {
    this.isLoading = true;
    this.notificationService.getLastAlerts(this.userId ,page).subscribe({
      next: (alerts) => {
        if (alerts.length === 0) {
          this.hasMorealerts = false; // No more messages to load
        } else {
          this.alerts = alerts; // Append new messages
        }
        this.isLoading = false;
      },
      error: (err) => {
        
        console.error('Error fetching unique waIds:', err);
        this.isLoading = false;
      }
    });
  }
  ngAfterViewInit() {
    // Add scroll event listener for infinite scrolling
    this.chatContainer.nativeElement.addEventListener('scroll', () => {
      const element = this.chatContainer.nativeElement;
      // Check if scrolled to bottom
      if (
        element.scrollTop + element.clientHeight >= element.scrollHeight - 20 &&
        !this.isLoading &&
        this.hasMoreMessages
      ) {
        this.loadMoreMessages();
      }
    });

    this.alertContainer.nativeElement.addEventListener('scroll', () => {
      const element = this.alertContainer.nativeElement;
      // Check if scrolled to bottom
      if (
        element.scrollTop + element.clientHeight >= element.scrollHeight - 20 &&
        !this.isLoading &&
        this.hasMorealerts
      ) {
        this.loadMoreAlerts();
      }
    });
  }

  loadChatOptions() {
    const storedOptions = localStorage.getItem('chatOptions');
    if (storedOptions) {
      try {
        const parsedOptions = JSON.parse(storedOptions);
        if (Array.isArray(parsedOptions) && parsedOptions.every((item) => typeof item === 'string')) {
          this.chatOptions = parsedOptions;
          this.fetchMessages(this.chatOptions, this.currentPage);
          return;
        }
      } catch (e) {
        console.error('Error parsing stored chatOptions:', e);
      }
    }
    this.fetchMessages(this.chatOptions, this.currentPage);
    this.loadUniqueWaIds();
  }


  fetchMessages(waIds: string[], page: number) {
    this.isLoading = true;
    this.notificationService.getMessages(waIds, page).subscribe({
      next: (messages) => {
        if (messages.length === 0) {
          this.hasMoreMessages = false; // No more messages to load
        } else {
          this.objects = [...this.objects, ...messages]; // Append new messages
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching messages:', err);
        this.isLoading = false;
      }
    });
  }

  

  loadMoreMessages() {
    if (!this.hasMoreMessages || this.isLoading) return;
    const waIds = this.selectedChats.value || [];
    if (waIds.length > 0) {
      this.currentPage++;
      this.fetchMessages(waIds, this.currentPage);
    }
  }
  loadMoreAlerts() {
    if (!this.hasMorealerts || this.isLoading) return;
    const waIds = this.selectedChats.value || [];
    if (waIds.length > 0) {
      this.currentPageAlert++;
      this.loadalerts(waIds, this.currentPageAlert);
    }
  }

  getApproveList() {
    this.apprvserv.get200appvd().subscribe((data) => {
      // console.log(data);
      this.approveList = data;
    }
    , (error) => {
      console.error('Error fetching approve list:', error);
    });
}

isImageMessage(message: any): boolean {
  return message.type === 'image' ;
}

getImageUrl(message: string): string {
  const urlMatch = message.match(/Photo : (https?:\/\/[^\s]+)/);
  return urlMatch ? urlMatch[1] : '';
}

// Method to check if a chat is selected
isSelected(chat: string): boolean {
  return this.selectedChats.value?.includes(chat) || false;
}

// Method to toggle a chat selection
toggleChat(chat: string): void {
  const currentValue = this.selectedChats.value || [];
  
  if (this.isSelected(chat)) {
    // Remove chat if already selected
    this.selectedChats.setValue(
      currentValue.filter(item => item !== chat)
    );
  } else {
    // Add chat if not selected
    this.selectedChats.setValue([...currentValue, chat]);
  }
}
}
