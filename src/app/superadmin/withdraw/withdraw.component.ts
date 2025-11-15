import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { OperationsService } from '../../services/operations.service';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';


import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DWModalComponent } from '../dw-modal/dw-modal.component';
import { MatSort } from '@angular/material/sort';
import { PaginatorService } from '../../services/paginator.service';
import { SuperAdminLandingService } from '../../services/super-admin-landing.service';
import { DepositSuperadminService } from '../../services/deposit-superadmin.service';
import { WithdrawSuperadminService } from '../../services/withdraw-superadmin.service';
import { ComponettitleService } from '../../services/componenttitle.service';
import { DialogTableComponent } from '../dialog-table/dialog-table.component';


@Component({
  selector: 'app-withdraw',

  templateUrl: './withdraw.component.html',
  styleUrl: './withdraw.component.scss',
})
export class WithdrawComponent {
  todayWithdraw :number = 0;
  displayedColumns = ['position', 'userId', 'approved', 'rejected', 'count' ];
  dataSource : any[] = [];
  filteredDataSource: any[] = [];
  lastWeekWithdraw: number= 0 ;
  lastWeekWithdrawCounts: number= 0 ;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  depositTableArray:any[];
  loader: boolean = false;
  todayWCounts: any =0;
  searchTerm: string = '';
  filterFromDate: Date | null = null;
  filterToDate: Date | null = null;
  activeQuickFilter: 'today' | 'week' | 'month' | null = 'today';

  constructor(
    public dialog: MatDialog,
    public paginatorServ : PaginatorService,
    private landingservice : SuperAdminLandingService,
    private withdrawsuperadminserv:WithdrawSuperadminService,
    private   titleService:ComponettitleService
    
  ) {}
  @ViewChild('fileInput') fileInput: ElementRef;
  
  ngOnInit(): void {
    this.titleService.changeTitle('Withdraw panel');
    this.getWithdraW();
    this.getTodayWithdraw();
    this.getWithDrawTabledata();
    // set default filters to today and load counts
    const today = new Date();
    this.filterFromDate = today;
    this.filterToDate = today;
    const start = this.formatDate(today);
    const end = this.formatDate(today);
    this.loadCountsByUserForRange(start, end);
    
  }

  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  // }
  openDialog() {
    const dialogConfig = new MatDialogConfig();
    // dialogConfig.width = '80%';
    
    dialogConfig.data = {
      initialData: "Withdraw",
      userId: null,
  };
   
    const dialogRef = this.dialog.open(DWModalComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
     
    });
  }
  filterData(searchTerm: string) {
    this.searchTerm = searchTerm || '';
    this.applyFilters();
   }

  //===================================paginator service================================
  // fetchUsers() {
  //   // Call your service to fetch users, assuming it returns an Observable
  //   this.paginatorServ.getUsersWithdraw().subscribe(users => {
  //     this.dataSource = users ;
  //   });
  // }

  // nextPage(event: any) {
  //   // If next page button is clicked
  //   if (event.previousPageIndex < event.pageIndex) {
  //     // Assuming your service method takes page number and page size as arguments
  //     this.paginatorServ.getUsersWithdraw(event.pageIndex + 1, this.paginator.pageSize).subscribe(users => {
  //       this.dataSource = users;
  //     });
  //   }
  // }
  //===================================================================================
  getWithdraW() {
  
    this.landingservice.getWithdraw().subscribe(
      (data) => {
      
    
        this.lastWeekWithdraw = data.amount;
        this.lastWeekWithdrawCounts = data.count;
       
      },
      (error) => {
        console.error(error);
        // Handle error
        
      }
    );
  }

  getWithDrawTabledata() {
    this.loader = true;
    this.withdrawsuperadminserv.getWithdrawdata().subscribe(
      (data) => {

     
      this.dataSource=Object.entries(data).map(([userId, count]) => ({
        userId,
        approved: count || 0,
        rejected: 0,
        count: count || 0
    }));
    this.depositTableArray=this.dataSource;
    this.applyFilters();
    this.loader = false;
        
      },
      (error) => {
        console.error(error);
        this.loader = false;
      
      }
    );
  }

  getTodayWithdraw() {
    
    this.landingservice.getTodaysWithdraw().subscribe(
      (data) => {
       
 
   this.todayWithdraw = data.amount;
        this.todayWCounts = data.count;
      
       } , 
    
      (error) => {
        console.error(error);
      }
    );
  }



  openLastWeekDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '70%';
    dialogConfig.data = {
      operation : "Withdraw",
      type : "Lastweek's",
    };
    const dialogRef = this.dialog.open(DialogTableComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
     
    });
  }

  openTotalWithdrawDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '70%';
  
    dialogConfig.data = {
      operation : "Withdraw",
      type : "Total",
    };
   
    const dialogRef = this.dialog.open(DialogTableComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
     
    });
  }
  

  openTodaysWithdrawDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '70%';
   
    dialogConfig.data = {
      operation : "Withdraw",
      type : "Today's",
    };
   
    const dialogRef = this.dialog.open(DialogTableComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
     
    });
  }

  private formatDate(d: Date | string | any): string {
    if (!d) return '';
    if (typeof d === 'string') {
      const s = d.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) return this.formatDate(parsed);
      return s;
    }
    if (d instanceof Date) {
      const yyyy = d.getFullYear();
      const mm = ('0' + (d.getMonth() + 1)).slice(-2);
      const dd = ('0' + d.getDate()).slice(-2);
      return `${yyyy}-${mm}-${dd}`;
    }
    if ((d as any).year && (d as any).month && (d as any).day) {
      const y = (d as any).year;
      const m = ('0' + (d as any).month).slice(-2);
      const day = ('0' + (d as any).day).slice(-2);
      return `${y}-${m}-${day}`;
    }
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return this.formatDate(parsed);
    return '';
  }

  loadCountsByUserForRange(startDate: string, endDate: string) {
    this.loader = true;
    this.withdrawsuperadminserv.getApprovedRejectedCountsByZUserAndDateRange(startDate, endDate)
      .subscribe(
        (resp) => {
          const rows = Object.entries(resp).map(([userId, val]) => {
            const approved = (val && (val as any).approved) || 0;
            const rejected = (val && (val as any).rejected) || 0;
            return {
              userId,
              approved,
              rejected,
              count: approved + rejected
            };
          });
          this.dataSource = rows;
          this.depositTableArray = this.dataSource;
          this.applyFilters();
          this.loader = false;
        },
        (err) => {
          console.error('Failed to load approved/rejected counts', err);
          this.loader = false;
        }
      );
  }

  statusClass(status: string) {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('pending')) return 'status-pending';
    if (s.includes('completed') || s.includes('success')) return 'status-success';
    if (s.includes('failed') || s.includes('rejected')) return 'status-failed';
    return '';
  }

  viewWithdraw(row: any) {
    console.log('viewWithdraw', row);
  }

  editWithdraw(row: any) { console.log('edit', row); }
  deleteWithdraw(row: any) { console.log('delete', row); }

  applyFilters(): void {
    if (!this.dataSource) {
      this.filteredDataSource = [];
      return;
    }

    let filtered = this.dataSource.slice();

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(item => (item.userId || '').toString().toLowerCase().includes(term));
    }

    if (this.filterFromDate || this.filterToDate) {
      const from = this.filterFromDate ? new Date(this.filterFromDate).setHours(0,0,0,0) : null;
      const to = this.filterToDate ? new Date(this.filterToDate).setHours(23,59,59,999) : null;

      filtered = filtered.filter(item => {
        if (!item.date) return true;
        const d = new Date(item.date).getTime();
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    this.filteredDataSource = filtered;
  }

  quickFilter(range: 'today' | 'week' | 'month') {
    this.activeQuickFilter = range;
    const now = new Date();
    if (range === 'today') {
      this.filterFromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      this.filterToDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'week') {
      const first = new Date(now);
      first.setDate(now.getDate() - 6);
      this.filterFromDate = new Date(first.getFullYear(), first.getMonth(), first.getDate());
      this.filterToDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'month') {
      this.filterFromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      this.filterToDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    const start = this.filterFromDate ? this.formatDate(this.filterFromDate) : null;
    const end = this.filterToDate ? this.formatDate(this.filterToDate) : null;
    if (start && end) {
      this.loadCountsByUserForRange(start, end);
    } else {
      this.applyFilters();
    }
  }

  applyDateFilter() {
    if (!this.filterFromDate || !this.filterToDate) return this.applyFilters();
    const start = this.formatDate(this.filterFromDate);
    const end = this.formatDate(this.filterToDate);
    this.loadCountsByUserForRange(start, end);
  }


  }

 

 




