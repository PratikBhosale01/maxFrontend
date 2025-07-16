import { Component } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { SearchsuperadminService } from '../../services/searchsuperadmin.service';
import { DepositSuperadminService } from '../../services/deposit-superadmin.service';
import { LastweekdataService } from '../../services/lastweekdata.service';
import { ComponettitleService } from '../../services/componenttitle.service';
import { ExcelService } from '../../services/excel.service';
import { OperationsService } from '../../services/operations.service';
import { MatDialog } from '@angular/material/dialog';
import { ApproveService } from '../../services/approve.service';
import { SnackbarService } from '../../services/snackbar.service';
import { interval, Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Buser } from '../../domain/Buser';
import { TeluserService } from '../../services/teluser.service';
import { ClietUserListComponent } from '../../shared/cliet-user-list/cliet-user-list.component';
import { SendmsgdailogComponent } from '../../shared/sendmsgdailog/sendmsgdailog.component';

@Component({
  selector: 'app-tel-users',
  templateUrl: './tel-users.component.html',
  styleUrl: './tel-users.component.scss'
})
export class TelUsersComponent {


  searchText: string = '';
  loader: boolean = false;
  telUser: Buser[] ;


  totalElements: number = 0;

  page;
  selectedStatuses = new FormControl('');

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
  displayedColumns: string[] = ['srNo', 'userId', 'firstName', 'lastName', 'operations'];


  // selectedStatus: string = '';

  constructor(
    private searchService: SearchsuperadminService,
    private depositService: DepositSuperadminService,
    private lastweekdata: LastweekdataService,
    private titleService: ComponettitleService,
    private excelService: ExcelService,
    private operation: OperationsService,
    public dialog: MatDialog,
    private telUserService: TeluserService,
    private snackbarService: SnackbarService,
  ) // private webSocketService: WebsocketService

  {
    this.titleService.changeTitle('Tel Users');
    this.dateRange = { start: null, end: null };
  }

  ngOnInit(): void {


    this.getUserId()
    this.getTelUsers();

    // this.subscription = interval(10000).subscribe(() => {
    //   if (this.searchText && this.searchText.trim() !== '') {
    //     this.pageNo = 0; // Reset to first page for a new search
    //     this.searchDeposits();
    //   } else {
    //     console.log('Search text is empty, no search will be performed.');
    //     // Optionally, you can fetch the default list if search is empty
    //     this.getTelUsers();
    //   }
    // });
    // this.getdata();
    // this.getRangedata();
    this.getTelUsers();
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
   
  }

  onSearchClick(): void {
    if (this.searchText && this.searchText.trim() !== '') {
      this.pageNo = 0; // Reset to first page for a new search
      this.searchDeposits(this.searchText);
    } else {
      console.log('Search text is empty, no search will be performed.');
      // Optionally, you can fetch the default list if search is empty
      this.getTelUsers();
    }
  }


  searchDeposits(clientId): void {

 
    
    this.loader = true;
    this.telUserService
      .searchBotUser(clientId)
      .subscribe(
        (data) => {
          this.telUser = data;
          // this.totalElements = data.totalElements;
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
    this.getTelUsers()
  }



  
  //==============================================================

  Avp(Id: number, retry: number) {
    this.loader = true;

    const userData = localStorage.getItem('user');

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

    // this.apprvserv.Approve(Id, retry, userId).subscribe(
    //   (data) => {
    //     console.log('Approve', data);
    //     this.getTelUsers();
    //     this.loader = false;
    //     this.snackbarService.snackbar('Successful !!', 'success');
    //   },
    //   (error) => {
    //     this.loader = false;
    //     console.log(error);
    //   }
    // );
  }
  Reject(Id: number) {
    
 
    this.getTelUsers();
   
  }

  manulAvp(utr: String) {
    // this.apprvserv.manualApprove(utr).subscribe(
    //   (data) => {
    //     // console.log('manual', data);
    //     this.getTelUsers();
    //     this.loader = false;
    //     this.snackbarService.snackbar('Successfull', 'success');
    //   },
    //   (error) => {
    //     this.loader = false;
    //     console.log(error);
    //   }
    // );
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

  
  getTelUsers(): void {
    this.loader = true; 
    this.telUserService
      .getTelUserData( this.pageSize, this.pageNo)
      .subscribe(
        (data) => {
          this.page = data;
          this.telUser = data.content;
          
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



  onPageEvent(event: PageEvent): void {
    this.pageNo = event.pageIndex;
    console.log(this.pageNo); //
    this.pageSize = event.pageSize;
    console.log(this.pageSize + 'pagesize'); //
    if (this.searchText && this.searchText.trim() !== '') {
      this.pageNo = 0; // Reset to first page for a new search
      this.searchDeposits(this.searchText);
    } else {
      console.log('Search text is empty, no search will be performed.');
      // Optionally, you can fetch the default list if search is empty
      this.getTelUsers();
    }
  }

  //======================================================
  // websocket(): void {
  //   // Subscribe to deposits data from the WebSocket service
  //   this.webSocketService.getTelUsers().subscribe((data: any[]) => {
  //     this.deposits = data;
  //     console.log(this.deposits);
  //   });

  //   // Send a request to get all deposits or specify particular statuses
  //   this.webSocketService.sendDepositRequest(['PENDING', 'APPROVED'], 0, 10);
  // }

  openClientDialog(id: number) {
    // console.log("open " + id );
    const dialogRef = this.dialog.open(ClietUserListComponent, {
      width: '700px',
      data: { id: id },
    });
    

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Rejection Reason:', result);
      }
      // this.getTelUsers();
    });

    
  }

  deleteReport(Id: number) {
//    
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

  openEditDialog() {
    const dialogRef = this.dialog.open(SendmsgdailogComponent, {
      width: '700px',
      data: "msgdailog",
    });
    

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Rejection Reason:', result);
      }
    
    });
  
  }
}
