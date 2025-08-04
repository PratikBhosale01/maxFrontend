import { DatePipe, formatDate } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SearchsuperadminService } from '../../services/searchsuperadmin.service';
import { DepositSuperadminService } from '../../services/deposit-superadmin.service';
import { LastweekdataService } from '../../services/lastweekdata.service';
import { ExcelService } from '../../services/excel.service';
import { lastWeekDeposit } from '../../domain/lastWeek';
import { AppvDeposit, Deposite } from '../../domain/Deposite';
import { ComponettitleService } from '../../services/componenttitle.service';
import { OperationsService } from '../../services/operations.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SlipComponent } from '../../shared/slip/slip.component';
import { ApproveService } from '../../services/approve.service';
import { interval, Subscription } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { RejectconfirmationComponent } from '../../shared/rejectconfirmation/rejectconfirmation.component';
import { SnackbarService } from '../../services/snackbar.service';
import { EditDialogComponent } from '../../shared/edit-dialog/edit-dialog.component';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { CheckAppvDailogComponent } from '../../shared/check-appv-dailog/check-appv-dailog.component';
import { CreateUserDailogComponent } from '../../shared/create-user-dailog/create-user-dailog.component';
import { WithDailogComponent } from '../../shared/with-dailog/with-dailog.component';
import { DepoDailogComponent } from '../../shared/depo-dailog/depo-dailog.component';
// import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-appv-dlist',
  templateUrl: './appv-dlist.component.html',
  styleUrl: './appv-dlist.component.scss',
})
export class AppvDListComponent implements OnDestroy {

editReport(arg0: number) {
throw new Error('Method not implemented.');
}

  searchText: string = '';
  loader: boolean = false;
  deposit: any;
  deposits: AppvDeposit[];
  totalElements: number = 0;

  page;
  selectedStatuses = new FormControl('');
  statuses: string[] = [
    'ALL',
    'USER_CREATED',
    'PENDING',
    'APPROVED',
    'IN_PROCESS',
    'REJECTED',
    'DONE',
    'FAILED',
    'DELETED',
  ];
  // selectedStatus: string = '';
  dropdownOpen: boolean = false;
  cumulativeCount: number = 0; // Track cumulative count across pages
  dataSource: string;
  dateRange: { start: Date; end: Date };
  dataSourceType: string;
  StartDate;
  EndDate;
  searchTerm: string;
  inputPage: number;
  excelData;
  paginator: any;
  private subscription: Subscription;
  isActionTaken: boolean = false;
  pageNo: number = 0;
  pageSize: number = 8;
  user: any;
  userId:number ;
  isButtonClicked: { [key: number]: boolean } = {};
  retried: boolean = false;
  // selectedStatus: string = '';

  constructor(
    private searchService: SearchsuperadminService,
    private depositService: DepositSuperadminService,
    private lastweekdata: LastweekdataService,
    private titleService: ComponettitleService,
    private excelService: ExcelService,
    private operation: OperationsService,
    public dialog: MatDialog,
    private apprvserv: ApproveService,
    private snackbarService: SnackbarService,
  ) // private webSocketService: WebsocketService

  {
    this.titleService.changeTitle('Approve List');
    this.dateRange = { start: null, end: null };
  }

  ngOnInit(): void {
    //  this.websocket();
    this.selectedStatuses.valueChanges.subscribe((selectedStatuses) => {
      this.onStatusChange(selectedStatuses);
    });

    this.getUserId()
    this.getDeposits();

    this.subscription = interval(10000).subscribe(() => {
      if (this.searchText && this.searchText.trim() !== '') {
        this.pageNo = 0; // Reset to first page for a new search
        this.searchDeposits();
      } else {
        console.log('Search text is empty, no search will be performed.');
        // Optionally, you can fetch the default list if search is empty
        this.getDeposits();
      }
    });
    // this.getdata();
    // this.getRangedata();
    this.inputPage = 1;
  }

  ngOnDestroy() {
    // Unsubscribe from the interval observable when the component is destroyed
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  //===============================search============================
  updateSearchText(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchText = target.value;
    console.log('Search text updated:', this.searchText);
  }

  onSearchClick(): void {
    if (this.searchText && this.searchText.trim() !== '') {
      this.pageNo = 0; // Reset to first page for a new search
      this.searchDeposits();
    } else {
      console.log('Search text is empty, no search will be performed.');
      // Optionally, you can fetch the default list if search is empty
      this.getDeposits();
    }
  }


  searchDeposits(): void {

    const statusesToSend =
    this.selectedStatuses.value.length > 0
      ? this.selectedStatuses.value
      : ['PENDING', 'IN_PROCESS', 'FAILED', 'APPROVED','USER_CREATED'];
    // this.loader = true;
    this.apprvserv
      .searchDeposits(statusesToSend,this.searchText, this.pageSize, this.pageNo)
      .subscribe(
        (data) => {
          this.deposits = data.content;
          this.totalElements = data.totalElements;
          this.loader = false;
        },
        (error) => {
          console.log('Error during search:', error);
          this.loader = false;
        }
      );
  }

  refresh() {
    this.searchText="";
    this.getDeposits()
  }



  
  //==============================================================

  Avp(Id: number, retry: number ,) {
   
    const updatedData = {};
    const userData = localStorage.getItem('user');
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: {amount:"CheckAppv"},
    });
    dialogRef.afterClosed().subscribe((isConfirmed) => {
      if (isConfirmed) {

    if (userData) {
      this.user = JSON.parse(userData);
    } else {
      // Handle the case when user data is not available
      console.error('User data not found in localStorage');
      return;
    }
    const userId = this.user.user_id;
    if (!this.isActionTaken) {
      this.isActionTaken = true;
      // Your logic to approve the deposit
      console.log(`Approved user with ID: ${Id}`);
    }
     this.loader = true;
    this.apprvserv.Approvecheck(Id, retry, userId,updatedData).subscribe(
      (data) => {
        console.log('Approve', data);
        this.getDeposits();
        this.loader = false;
        this.snackbarService.snackbar('Successful !!', 'success');
      },
      (error) => {
        this.loader = false;
        console.log(error);
      }
    );
  }
});
  }

  retry(Id: number ,obj:any) {
    this.loader = true;
    this.retried=true;
    this.apprvserv.retry(Id,this.retried,obj).subscribe(
      (data) => {
        console.log('Approve', data);
        this.getDeposits();
        this.loader = false;
        this.snackbarService.snackbar('Successful !!', 'success');
      },
      (error) => {
        this.loader = false;
        console.log(error);
      }
    );
  }
  Reject(Id: number) {
    this.openRejectDialog(Id);
 
    this.getDeposits();
   
  }

  manulAvp(utr: String) {
     this.loader = true;
    this.apprvserv.manualApprove(utr).subscribe(
      (data) => {
        // console.log('manual', data);
        this.getDeposits();
        this.loader = false;
        this.snackbarService.snackbar('Successfull', 'success');
      },
      (error) => {
        this.loader = false;
        console.log(error);
      }
    );
  }
  disableButton(userId ): void {
    // Set the clicked state for the corresponding user.id to true
    this.isButtonClicked[userId] = true;
  }

  




  getSerialNumber(index: number): number {
    // Return the cumulative count plus the index within the current page
    return this.cumulativeCount + index + 1;
  }

  getFormattedDate(timestamp): string {
    // console.log(timestamp);
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Intl.DateTimeFormat(undefined, options).format(date);
  }
 

  approve(deposits) {
    const newDeposits = {
      id: deposits.id,
      userId: deposits.userId,
      utrNumber: deposits.utrNumber,
      amount: deposits.amount,
      date: deposits.entryTime, // Mapping entryTime to date
      status: deposits.status,
      siteId: deposits.site.id,
      zuserId: deposits.dtoZuser.id,
      reportID: deposits.reportID,
      bankId: deposits.bankDetails.id,
      // bankDetails: deposits.bankDetails,
      // siteMasterId:"",
      // totalAmount:deposits.amount,
    };

    console.log('inside approval');
  }

  
  getDeposits(): void {
    console.log(this.selectedStatuses.value);
    const statusesToSend =
      this.selectedStatuses.value.length > 0
        ? this.selectedStatuses.value
        : ['PENDING', 'IN_PROCESS', 'FAILED', 'APPROVED'];
    this.apprvserv
      .getSelectiondata(statusesToSend, this.pageSize, this.pageNo)
      .subscribe(
        (data) => {
          this.page = data;
          this.deposits = data.content;
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

  getSelectedStatusText(): string {
    const selected = this.selectedStatuses.value;
    if (!selected || selected.length === 0) {
      return 'No status selected';
    } else if (selected.length === 1) {
      return selected[0];
    } else {
      return `${selected[0]} (+${selected.length - 1} others)`;
    }
  }
  onStatusChange(newStatuses): void {
    this.pageNo = 0; // Reset to the first page whenever the filter changes
    if (this.paginator) {
      this.paginator.firstPage(); // Reset paginator to first page
    } // Reset paginator to first page
    this.getDeposits();
  }

  onPageEvent(event: PageEvent): void {
    this.pageNo = event.pageIndex;
    console.log(this.pageNo); //
    this.pageSize = event.pageSize;
    console.log(this.pageSize + 'pagesize'); //
    if (this.searchText && this.searchText.trim() !== '') {
      this.pageNo = 0; // Reset to first page for a new search
      this.searchDeposits();
    } else {
      console.log('Search text is empty, no search will be performed.');
      // Optionally, you can fetch the default list if search is empty
      this.getDeposits();
    }
  }



  openRejectDialog(id: number) {
    const dialogRef = this.dialog.open(RejectconfirmationComponent, {
      data: { id: id,
             type:"Deposit"        
       },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Rejection Reason:', result);
      }
    
    });

    this.getDeposits();
  }

  deleteReport(Id: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: null,
    });
    dialogRef.afterClosed().subscribe((isConfirmed) => {
      if (isConfirmed) {
        this.loader = true;
    this.apprvserv.deleteReport(Id, this.userId).subscribe({
      next: (response) => {
        console.log('Delete successful', response);
        this.getDeposits();
        this.snackbarService.snackbar('Deleted successful', 'success');
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

  openEditDialog(user: any): void {
    const dialogRef = this.dialog.open(EditDialogComponent, {
      width: '400px',
      data: user  // Pass the user object to the dialog
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle logic after the dialog is closed, if required (e.g., refreshing data)
        console.log('Dialog result:', result);
      }
    });
  }

  checkApprove(user) {
    const dialogRef = this.dialog.open(CheckAppvDailogComponent, {
      width: '800px',
      data: {
        user: user,
        type: "Deposit",
      }    // Pass the user object to the dialog
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle logic after the dialog is closed, if required (e.g., refreshing data)
        console.log('Dialog result:', result);
        this.getDeposits();
      }
    });
  }

  checkNewUserApprove(user) {
    const dialogRef = this.dialog.open(CreateUserDailogComponent, {
      width: '800px',
      data: {
        user: user,
        type: "Deposit",
      }    // Pass the user object to the dialog
    });

 
  }

  onClick(user: any): void {
    if (user.isNewId) {
      this.checkNewUserApprove(user);
    } else {
      this.checkApprove(user);
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
  
  
}
