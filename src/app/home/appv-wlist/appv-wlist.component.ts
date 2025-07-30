import { Component, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-appv-wlist',
  templateUrl: './appv-wlist.component.html',
  styleUrl: './appv-wlist.component.scss'
})
export class AppvWlistComponent implements OnDestroy {
  searchText: string = '';
  waNum: number = 0; // Default to 0 (All)
  
  userId: any;
  user: any;

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
 
constructor(
  private searchService: SearchsuperadminService,
 
  private lastweekdata: LastweekdataService,
  private titleService: ComponettitleService,

  public dialog: MatDialog,
  private apprvserv: ApproveService,
  private snackbarService: SnackbarService,
) // private webSocketService: WebsocketService

{

  this.titleService.changeTitle('Approve Withdraw List');
  // this.dateRange = { start: null, end: null };
  
  this.subscription = interval(10000).subscribe(() => {
    // if (this.searchText && this.searchText.trim() !== '') {
    //   this.pageNo = 0; // Reset to first page for a new search
    //   this.searchDeposits();
    // } else {
    //   console.log('Search text is empty, no search will be performed.');
   
      this.getWithdraws();
    // }
  });
}
refresh() {
throw new Error('Method not implemented.');
}
selectedStatuses = new FormControl('');
 statuses: string[] = [
  'ALL',
  'PENDING',
  'APPROVED',
  'IN_PROCESS',
  'REJECTED',
  'DONE',
  'FAILED',
  'DELETED',
  'MESSAGE_SENT',
  'INSUFFICIENT_BALANCE',
];
onSearchClick() {
throw new Error('Method not implemented.');
}
updateSearchText($event: Event) {
throw new Error('Method not implemented.');
}
 
   displayedColumns: string[] = ['Sr.no','userId', 'utrNumber', 'amount', 'entryTime', 'approveWithdrawStatus','approve', 'Operations'];
  
   // Define the data source (replace with your real data)
   dataSource ;
 
   ngOnInit(): void {
    this.selectedStatuses.valueChanges.subscribe((selectedStatuses) => {
      this.onStatusChange(selectedStatuses);
    });
    this.getWithdraws();
    this.getUserId();
   }


   getWithdraws(): void {
    console.log(this.selectedStatuses.value);
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
          // console.log( this.deposits);
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
    }  // Pass the user object to the dialog
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Handle logic after the dialog is closed, if required (e.g., refreshing data)
      // console.log('Dialog result:', result);
      this.getWithdraws();
    }
  });
}




 onStatusChange(newStatuses): void {
  this.pageNo = 0; // Reset to the first page whenever the filter changes
  if (this.paginator) {
    this.paginator.firstPage(); // Reset paginator to first page
  } // Reset paginator to first page
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
      console.log('Delete successful', response);
      this.snackbarService.snackbar('Deleted successful', 'success');
      this.getWithdraws();
      this.loader = false;
      // Handle success logic, e.g., showing a notification or refreshing the list
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
    this.userId = this.user.user_id;  // Get the user ID from storage
  } else {
    // Handle the case when user data is not available
    console.error('User data not found in localStorage or sessionStorage');
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
    console.log(this.pageNo); //
    this.pageSize = event.pageSize;
    console.log(this.pageSize + 'pagesize'); //
    if (this.searchText && this.searchText.trim() !== '') {
      this.pageNo = 0; // Reset to first page for a new search
      // this.searchDeposits();
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

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

 }

 




