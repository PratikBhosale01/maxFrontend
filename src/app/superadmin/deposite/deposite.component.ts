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
import { Operation, Operations } from '../../domain/operation';
import { DepositTable } from '../../domain/table';
import { ComponettitleService } from '../../services/componenttitle.service';
import { DialogTableComponent } from '../dialog-table/dialog-table.component';

@Component({
  selector: 'app-deposite',
  templateUrl: './deposite.component.html',
  styleUrl: './deposite.component.scss',
})
export class DepositeComponent implements OnInit {
  displayedColumns = ['position', 'userId', 'approved', 'rejected', 'count'];
  dataSource : any[] = [];
  filteredDataSource: any[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  todaydeposit:number = 0;
  loader: boolean = false;
  lastWeekdeposit: number =0;
  lastWeekdepositCounts: number =0;
  currentdepo: number = 0;
  depositTableArray:any[];
  todayCounts: any =0;
  searchTerm: string = '';
  filterFromDate: Date | null = null;
  filterToDate: Date | null = null;
  activeQuickFilter: 'today' | 'week' | 'month' | null = 'today';

  constructor(
    public dialog: MatDialog,
    public paginatorServ : PaginatorService,
    private landingservice : SuperAdminLandingService,
    private depositsuperadminserv : DepositSuperadminService,
    private titleService : ComponettitleService
    
    
  ) {}
  @ViewChild('fileInput') fileInput: ElementRef;
  
  ngOnInit(): void {
    this.titleService.changeTitle('Deposit panel');
    this.getDeposite();
    this.getTodayDeposit();
    // initial load - fetch today's range by default
    const today = new Date();
    const start = this.formatDate(today);
    const end = this.formatDate(today);
    this.filterFromDate = today;
    this.filterToDate = today;
    this.loadCountsByUserForRange(start, end);
  }


  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '50%';
   
    dialogConfig.data = {
      initialData: "Deposit",
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



  getDeposite() {
   
    this.landingservice.getDeposite().subscribe(
      (data) => {
      
       
        this.lastWeekdeposit = data.amount;
        this.lastWeekdepositCounts = data.count;
        this.currentdepo=this.lastWeekdeposit;
      
      },
      (error) => {
        console.error(error);
      }
    );




  }
  getTodayDeposit() {
    
    this.landingservice.getTodaysDeposit().subscribe(
      (data) => {
    
 
         this.todaydeposit = data.amount;
          this.todayCounts = data.count;
      
       } , 
    
      (error) => {
        console.error(error);
      }
    );
  }

  getDepositeTabledata() {
    this.loader = true;
    this.depositsuperadminserv.getDepositdata().subscribe(
      (data) => {

     
    this.dataSource=Object.entries(data).map(([userId, count]) => ({
      userId,
      approved: count || 0,
      rejected: 0,
      count: count || 0
    }));
    this.depositTableArray=this.dataSource;
    // initialize filtered view
    this.applyFilters();
    this.loader = false;
        
      },
      (error) => {
        console.error(error);
        this.loader = false;
      
      }
    );
  }

  private formatDate(d: Date | string | any): string {
    // Normalize various possible date inputs and return yyyy-MM-dd
    if (!d) return '';

    // If already a string in yyyy-MM-dd format, return directly
    if (typeof d === 'string') {
      const s = d.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      // try to parse generic ISO or browser date string
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      } else {
        // fallback: return trimmed string (best effort)
        return s;
      }
    }

    // If it's a Date instance now
    if (d instanceof Date) {
      const yyyy = d.getFullYear();
      const mm = ('0' + (d.getMonth() + 1)).slice(-2);
      const dd = ('0' + d.getDate()).slice(-2);
      return `${yyyy}-${mm}-${dd}`;
    }

    // If it's an object like {year, month, day} (e.g., NgbDateStruct)
    if ((d as any).year && (d as any).month && (d as any).day) {
      const y = (d as any).year;
      const m = ('0' + (d as any).month).slice(-2);
      const day = ('0' + (d as any).day).slice(-2);
      return `${y}-${m}-${day}`;
    }

    // Last resort: try to construct a Date and format
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = ('0' + (parsed.getMonth() + 1)).slice(-2);
      const dd = ('0' + parsed.getDate()).slice(-2);
      return `${yyyy}-${mm}-${dd}`;
    }

    return '';
  }

  loadCountsByUserForRange(startDate: string, endDate: string) {
    this.loader = true;
    this.depositsuperadminserv.getApprovedRejectedCountsByZUserAndDateRange(startDate, endDate)
      .subscribe(
        (resp) => {
          // resp is an object where keys are userIds and values are {approved, rejected}
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

  viewDeposit(row: any) {
    // open a dialog or navigate to detail - placeholder
    console.log('viewDeposit', row);
  }

  editDeposit(row: any) {
    console.log('editDeposit', row);
  }

  deleteDeposit(row: any) {
    console.log('deleteDeposit', row);
  }

  pageEvent(event: any) {
    // placeholder for paginator handling if needed
    // event has pageIndex, pageSize, length
  }

  openLastWeekDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '70%';
    // dialogConfig.height ='90%';
    dialogConfig.data = {
      operation : "Deposit",
      type : "Lastweek's",
    };
  
    const dialogRef = this.dialog.open(DialogTableComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
     
    });
  }

  openTotalDepositeDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '70%';
    // dialogConfig.height ='90%';
    dialogConfig.data = {
      operation : "Deposit",
      type : "Total",
    };
   
    const dialogRef = this.dialog.open(DialogTableComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
     
    });
  }
  

  openTodaysDepositeDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '70%';
    // dialogConfig.height ='90%';
    dialogConfig.data = {
      operation : "Deposit",
      type : "Today's",
    };
   
    const dialogRef = this.dialog.open(DialogTableComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
     
    });
  }
  applyFilters(): void {
    if (!this.dataSource) {
      this.filteredDataSource = [];
      return;
    }

    let filtered = this.dataSource.slice();

    // text search
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(item => (item.userId || '').toString().toLowerCase().includes(term));
    }

    // date range filter - only apply if items have a date property
    if (this.filterFromDate || this.filterToDate) {
      const from = this.filterFromDate ? new Date(this.filterFromDate).setHours(0,0,0,0) : null;
      const to = this.filterToDate ? new Date(this.filterToDate).setHours(23,59,59,999) : null;

      filtered = filtered.filter(item => {
        if (!item.date) return true; // if date not present, keep the item
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
      first.setDate(now.getDate() - 6); // last 7 days
      this.filterFromDate = new Date(first.getFullYear(), first.getMonth(), first.getDate());
      this.filterToDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'month') {
      this.filterFromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      this.filterToDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    // when quick filters are used, call server with date range to get approved/rejected counts
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






 

