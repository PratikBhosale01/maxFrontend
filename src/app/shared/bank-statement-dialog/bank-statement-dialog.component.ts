import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { VoucherDialogComponent } from '../voucher-dialog/voucher-dialog.component';
import { BankingService } from '../../services/banking.service';


@Component({
  selector: 'app-bank-statement-dialog',
  templateUrl: './bank-statement-dialog.component.html',
  styleUrls: ['./bank-statement-dialog.component.scss']
})
export class BankStatementDialogComponent implements OnInit {
  bank: any;
  transactions: any[] = [];
  loading = false;
  error: string | null = null;
  // pagination
  pageNo = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;
  isLast = false;
  isFirst = false;
  numberOfElements = 0;

  constructor(
    public dialogRef: MatDialogRef<BankStatementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private bankingService: BankingService,
    public dialog: MatDialog
  ) {}

  openVoucher() {
    const dialogRef = this.dialog.open(VoucherDialogComponent, {
      width: '480px',
      panelClass: 'voucher-dialog-panel',
      data: { bank: this.bank }
    });

    dialogRef.afterClosed().subscribe(result => {
          this.getBank();
      if (result) {
      
        
        // TODO: call bankingService or a voucher service to persist the voucher
      }
    });
  }
ngOnInit(): void {
    this.getBank();
}
  getBank(): void {
    const passedBank = this.data?.bank;
    const bankId = passedBank?.id ?? this.data?.bankId;
    if (bankId != null) {
      this.loading = true;
      // First fetch latest bank details
      this.bankingService.getBankById(bankId).subscribe(
        (bankRes) => {
          this.bank = bankRes;
          // Then fetch first page of transactions for this bank
          this.loadTransactions(bankId, this.pageNo);
        },
        (err) => {
          console.error('Error loading bank details', err);
          this.error = 'Failed to load bank details';
          this.loading = false;
        }
      );
    } else {
      this.error = 'No bank id provided';
    }
  }

  loadTransactions(bankId: number, page: number) {
    this.loading = true;
    this.bankingService.getBankTransactions(bankId, page, this.pageSize).subscribe(
      (res) => {
        // Expecting paginated response with `content` array and pagination metadata
        this.transactions = res?.content || [];
        this.pageNo = res?.pageable?.pageNumber ?? res?.number ?? page;
        this.pageSize = res?.pageable?.pageSize ?? res?.size ?? this.pageSize;
        this.totalElements = res?.totalElements ?? 0;
        this.totalPages = res?.totalPages ?? 0;
        this.isLast = res?.last ?? false;
        this.isFirst = res?.first ?? false;
        this.numberOfElements = res?.numberOfElements ?? (this.transactions?.length ?? 0);
        this.loading = false;
      },
      (err) => {
        console.error('Error loading bank transactions', err);
        this.error = 'Failed to load transactions';
        this.loading = false;
      }
    );
  }

  prevPage() {
    if (this.pageNo > 0) {
      this.pageNo--;
      const bankId = this.bank?.id ?? this.data?.bankId;
      if (bankId != null) this.loadTransactions(bankId, this.pageNo);
    }
  }

  nextPage() {
    if (!this.isLast && this.pageNo + 1 < this.totalPages) {
      this.pageNo++;
      const bankId = this.bank?.id ?? this.data?.bankId;
      if (bankId != null) this.loadTransactions(bankId, this.pageNo);
    }
  }

   getFormattedDate(timestamp): string {
    // Short format: dd/MM/yy HH:mm
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear().toString().slice(-2);
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  close(): void {
    this.dialogRef.close();
  }
}
