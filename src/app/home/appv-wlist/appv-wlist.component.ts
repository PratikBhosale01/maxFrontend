import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { SearchsuperadminService } from '../../services/searchsuperadmin.service';
import { LastweekdataService } from '../../services/lastweekdata.service';
import { ComponettitleService } from '../../services/componenttitle.service';
import { MatDialog } from '@angular/material/dialog';
import { ApproveService } from '../../services/approve.service';
import { SnackbarService } from '../../services/snackbar.service';
import { CheckAppvDailogComponent } from '../../shared/check-appv-dailog/check-appv-dailog.component';
import { interval, Subscription } from 'rxjs';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { PageEvent } from '@angular/material/paginator';
import { WithDailogComponent } from '../../shared/with-dailog/with-dailog.component';
import { DepoDailogComponent } from '../../shared/depo-dailog/depo-dailog.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-appv-wlist',
  templateUrl: './appv-wlist.component.html',
  styleUrl: './appv-wlist.component.scss'
})
export class AppvWlistComponent {
  @Input() compactColumns: string[] | null = null;
  @Input() embedded: boolean = false;
  searchText: string = '';
  waNum: number = 0; // Default to 0 (All)
  
  userId: any;
  user: any;
  userRole: any;

openEditDialog(arg0: any) {
throw new Error('Method not implemented.');
}

isButtonClicked: { [key: number]: boolean } = {};
searchTerm: string;
loader: any;
pageNo: number = 0;
pageSize: number = 8;
  page: any;
  withdraws: any;
  paginator: any;
  totalElements: number = 0;
  private subscription: Subscription;
   bankNotifications: any[] = [];
  private draggedNotification: any = null;
  isBankNotificationsVisible: boolean = true;


constructor(
  private searchService: SearchsuperadminService,
 
  private lastweekdata: LastweekdataService,
  private titleService: ComponettitleService,
  private notificationService: NotificationService,
  public dialog: MatDialog,
  private apprvserv: ApproveService,
  private snackbarService: SnackbarService,
) // private webSocketService: WebsocketService

{
        this.getUserId();
     this.loadBankNotifications();
  this.titleService.changeTitle('Approve Withdraw List');
  // this.dateRange = { start: null, end: null };
  
  this.subscription = interval( 2000).subscribe(() => {
 
     this.loadBankNotifications();
      this.getWithdraws();
    // }
  });
}
refresh() {
throw new Error('Method not implemented.');
}
  selectedStatuses = new FormControl('');
 
  statuses: string[] = [];

  private setStatusesByRole(): void {
    const baseStatuses = [
      'ALL',
      'PENDING',
      'APPROVED',
      'IN_PROCESS',
      'REJECTED',
      'DONE',
      'FAILED',
      'MESSAGE_SENT',
      'INSUFFICIENT_BALANCE',
    ];

    if (
      this.userRole === 'APPROVEDEPOSIT' ||
      this.userRole === 'ADMIN' ||
      this.userRole === 'SUPERADMIN'
    ) {
      // Admin-like roles get the 'DELETED' status too
      this.statuses = [...baseStatuses, 'DELETED'];
    } else {
      this.statuses = baseStatuses;
    }
  }
onSearchClick() {
throw new Error('Method not implemented.');
}
updateSearchText($event: Event) {
throw new Error('Method not implemented.');
}
 
   displayedColumns: string[] = ['Sr.no','userId', 'amount', 'entryTime',  'approveWithdrawStatus','approve', 'Operations'];
  
  
   dataSource ;
 
   ngOnInit(): void {

    if (this.compactColumns && Array.isArray(this.compactColumns) && this.compactColumns.length) {
      this.displayedColumns = this.compactColumns;
    }
    // When embedded, drop the Sr.no column by default if still present
    if (this.embedded) {
      this.displayedColumns = this.displayedColumns.filter(c => c !== 'Sr.no');
    }
    // make sure statuses reflect the current user's role
    this.setStatusesByRole();

    this.selectedStatuses.valueChanges.subscribe((selectedStatuses) => {
      this.onStatusChange(selectedStatuses);
    });
    this.getWithdraws();
  
   }


   getWithdraws(): void {
   
    const statusesToSend =
      this.selectedStatuses.value.length > 0
        ? this.selectedStatuses.value
        : ['PENDING', 'IN_PROCESS', 'FAILED', 'APPROVED','DONE', 'INSUFFICIENT_BALANCE'];
    this.apprvserv
      .getSelectionWithdrawdata(statusesToSend, this.pageSize, this.pageNo, this.waNum)
      .subscribe(
        (data) => {
          this.page = data;
          this.withdraws = data.content;
     
          if (this.paginator) {
            this.paginator.length = data.totalElements; // Update paginator length with total elements
          }
          this.loader = false; // Update the paginator length with total elements
        },
        (error) => {
          console.log(error);
          this.loader = false;
        }
      );
  }

  disableButton(userId ): void {
    // Set the clicked state for the corresponding user.id to true
    this.isButtonClicked[userId] = true;
  }
 retry(id:number){
  this.loader=true;
  this.apprvserv.retryWithdraw(id).subscribe((data) => {
    this.snackbarService.snackbar('Withdrawal request has been retried successfully.', 'Dismiss');
    this.getWithdraws();
    this.loader=false;
  },(error) => {
    console.log(error + ': error');
    this.loader=false;
    this.snackbarService.snackbar('Failed to retry withdrawal request.', 'Dismiss');
  });
 }

 checkApprove(user) {
  const dialogRef = this.dialog.open(CheckAppvDailogComponent, {
    width: '990px',
    data: {
      user: user,
      type: "withdraw",
    }  
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.getWithdraws();
    }
  });
}




 onStatusChange(newStatuses): void {
  this.pageNo = 0; 
  if (this.paginator) {
    this.paginator.firstPage();
  } 
  this.getWithdraws();
}

deleteReport(Id: number) {
  const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    width: '300px',
    data: null,
  });
  dialogRef.afterClosed().subscribe((isConfirmed) => {
    if (isConfirmed) {
      this.loader = true;
  this.apprvserv.deleteWithdraw(Id, this.userId).subscribe({
    next: (response) => {
   
      this.snackbarService.snackbar('Deleted successful', 'success');
      this.getWithdraws();
      this.loader = false;
     
    },
    error: (error) => {
      console.error('Delete failed', error);
      this.loader = false;
      // Handle error logic, e.g., showing an error message
    }
  })
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
    this.userId = this.user.user_id;
    this.userRole = this.user.role_user;
  
    this.setStatusesByRole();

  } else {
    
    console.error('User data not found in localStorage');
    return;
  }
}
searchDeposits(): void {

  const statusesToSend =
  this.selectedStatuses.value.length > 0
    ? this.selectedStatuses.value
    : ['PENDING', 'IN_PROCESS', 'FAILED', 'APPROVED','USER_CREATED'];
  // this.loader = true;
  this.apprvserv
    .searchWithdraws(statusesToSend,this.searchText, this.pageSize, this.pageNo)
    .subscribe(
      (data) => {
        this.withdraws = data.content;
        this.totalElements = data.totalElements;
        this.loader = false;
      },
      (error) => {
        console.log('Error during search:', error);
        this.loader = false;
      }
    );
}


 onPageEvent(event: PageEvent): void {
    this.pageNo = event.pageIndex;
  
    this.pageSize = event.pageSize;

    if (this.searchText && this.searchText.trim() !== '') {
      this.pageNo = 0;
    } else {
      console.log('Search text is empty, no search will be performed.');
      // Optionally, you can fetch the default list if search is empty
      this.getWithdraws();
    }
  }

  withdarwDialog() {
              const dialogRef = this.dialog.open(WithDailogComponent, {
                width: '800px',
                data: null,}
              );
              }

   depositeDialog() {
            const dialogRef = this.dialog.open(DepoDailogComponent, {
              width: '800px',
              data: null,}
            );
            }            

onWaNumChange(value: number): void {
 // Add your logic here
  this.waNum = value; // Update the waNum property with the selected value
  this.getWithdraws(); // Call the method to fetch data based on the selected WA number
}

 onDragStart(event: DragEvent, notification: any) {
    this.draggedNotification = notification;
    event.dataTransfer.setData('text/plain', JSON.stringify(notification));
  }

  closeNotification(id: number) {
    this.notificationService.closeWNotification(id).subscribe({
      next: (response) => {
       this.loadBankNotifications();// Refresh the notifications list
      },
      error: (error) => {
   console.log(error);
  }
  });  
}

  loadBankNotifications() {
   
            this.getUserId();
      this.notificationService.getOtpNotifications(this.userId).subscribe({
        next: (notifications) => {
          this.bankNotifications = notifications;

          
        },
        error: (error) => {
          console.error('Error loading bank notifications:', error);
          
        }
      });
   }
 

  toggleBankNotifications() {
    this.isBankNotificationsVisible = !this.isBankNotificationsVisible;
  }

 }

 




