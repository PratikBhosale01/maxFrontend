import { Component, Input, Output, EventEmitter, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ApproveWithdrawsService } from '../../../services/approve-withdraws.service';



@Component({
  selector: 'app-withdraw-dialog',
  templateUrl: './withdraw-dialog.component.html',
  styleUrls: ['./withdraw-dialog.component.scss']
})
export class WithdrawDialogComponent implements OnInit, AfterViewInit {
  @Input() user: any | null = null;
  @Output() close = new EventEmitter<void>();

  displayedColumns: string[] = ['srNo', 'userId', 'amount', 'entryTime', 'approveWithdrawStatus' ];

  dataSource = new MatTableDataSource<any>([]);
  loading = true;

  // server-side pagination/filter state
  pageIndex = 0;
  pageSize = 5;
  withdrawCount = 0; // total matching rows
  withdrawTotal = 0; // total amount across matching rows

  searchValue = '';
  fromDate: string | null = null;
  toDate: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private withdrawService: ApproveWithdrawsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
      // listen to page changes
      this.paginator.page.subscribe((ev: PageEvent) => this.onPageChange(ev));
    }
  }

  loadData(): void {
    this.loading = true;
    // derive zuserId (accept several common id property names)
    const rawId = this.user ? (this.user.id ?? this.user.userId ?? this.user.zuserId ?? this.user.username) : undefined;
    const zuserId = rawId ? Number(rawId) : NaN;

    if (!zuserId || Number.isNaN(zuserId)) {
      // no valid user id, clear data and stop
      this.dataSource.data = [];
      this.withdrawCount = 0;
      this.withdrawTotal = 0;
      this.loading = false;
      return;
    }

    this.withdrawService.getApproveWithdrawsByExecutedByZuserId(
      zuserId,
      this.fromDate || null,
      this.toDate || null,
      this.pageIndex,
      this.pageSize,
      this.searchValue || null
    ).subscribe(result => {
      // backend may return different shapes. try common fallbacks
      const items = result?.items ?? result?.content ?? result?.data ?? result?.approveWithdraws ?? [];
      const total = result?.total ?? result?.totalElements ?? result?.totalCount ?? (Array.isArray(items) ? items.length : 0);
      const totalAmount = result?.totalAmount ?? result?.sum ?? 0;

      this.dataSource.data = items;
      // Use server-side pagination total as a fallback, but fetch today's approved stats
      // from dedicated endpoint which returns {count, amount} for the given zuserId.
      // This endpoint is used to populate withdrawCount and withdrawTotal as requested.
      this.withdrawCount = total;
      this.withdrawTotal = totalAmount;

      // If both fromDate and toDate are set, call datewise stats endpoint,
      // otherwise fall back to today's stats.
      
      this.withdrawService.getDatewiseApprovedStats(zuserId, this.fromDate, this.toDate).subscribe(stats => {
        if (stats) {
          this.withdrawCount = Number(stats.count ?? this.withdrawCount ?? 0);
          this.withdrawTotal = Number(stats.totalAmount ?? this.withdrawTotal ?? 0);
        }
        this.loading = false;
        // update paginator in case count changed
        if (this.paginator) {
          this.paginator.length = this.withdrawCount;
        }
      }, _err2 => {
        // if stats call fails, keep previous values
        this.loading = false;
        if (this.paginator) {
          this.paginator.length = this.withdrawCount;
        }
      });

      // ensure paginator length/pageSize reflect server
      if (this.paginator) {
        this.paginator.length = total;
        this.paginator.pageSize = this.pageSize;
      }
    }, _err => {
      // on error, clear and stop loading
      this.dataSource.data = [];
      this.withdrawCount = 0;
      this.withdrawTotal = 0;
      this.loading = false;
    });
  }

  applyFilter(value: string) {
    // For server-side, set search value and reload from page 0
    this.onSearch(value);
  }

  onSearch(value: string) {
    this.searchValue = (value || '').trim();
    this.pageIndex = 0;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.loadData();
  }

  onDateChange(from?: string | null, to?: string | null) {
    // Update internal values
    this.fromDate = from || null;
    this.toDate = to || null;
    this.pageIndex = 0;
    if (this.paginator) this.paginator.pageIndex = 0;

 
    const bothSet = !!this.fromDate && !!this.toDate;
    const bothCleared = !this.fromDate && !this.toDate;
    if (bothSet || bothCleared) {
      this.loadData();
    } else {
      // If only one date is set (typically when user picked start but not end),
      // do not fetch — allow the user to pick the second date. Optionally,
      // show an empty result set to avoid confusion; here we keep current data
      // intact until full range is selected.
    }
  }

  onPageChange(ev: PageEvent) {
    this.pageIndex = ev.pageIndex;
    this.pageSize = ev.pageSize;
    this.loadData();
  }

  formatLocalTime(ts: string) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString();
  }

  onClose() {
    this.close.emit();
  }

  // Placeholder for approve action
  approve(record: any) {
    // In real implementation call an endpoint. For now toggle status locally.
    if (record.approveWithdrawStatus === 'APPROVED') {
      record.approveWithdrawStatus = 'PENDING';
    } else {
      record.approveWithdrawStatus = 'APPROVED';
    }
    // refresh totals (amounts unchanged in this demo)
  }
}
