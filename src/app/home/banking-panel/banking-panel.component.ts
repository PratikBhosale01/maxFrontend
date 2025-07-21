import { Component, ElementRef, ViewChild } from '@angular/core';
// import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
// import { DialogTableComponent } from '../dialog-table/dialog-table.component';
import { AddBankingDialogComponent } from '../../shared/add-banking-dialog/add-banking-dialog.component';
import { BankingService } from '../../services/banking.service';
import { DailogTABComponent } from '../../shared/dailog-tab/dailog-tab.component';
import { UpdateBankComponent } from '../../shared/update-bank/update-bank.component';
import { SnackbarService } from '../../services/snackbar.service';
import { BankAccountTableComponent } from '../../shared/bank-account-table/bank-account-table.component';
import { BankAccount } from '../../domain/Bank';
import { BotbankingupdateComponent } from '../../shared/botbankingupdate/botbankingupdate.component';
import { AddslotdailogComponent } from '../../shared/addslotdailog/addslotdailog.component';
import { AmountRangeDailogComponent } from '../../shared/amount-range-dailog/amount-range-dailog.component';
import { AttachedslotrangeComponent } from '../../shared/attachedslotrange/attachedslotrange.component';
import { CheckAppvDailogComponent } from '../../shared/check-appv-dailog/check-appv-dailog.component';
import { CheckbankAccountComponent } from '../../shared/checkbank-account/checkbank-account.component';
import { SlotService } from '../../services/slot.service';


@Component({
  selector: 'app-banking-panel',
  templateUrl: './banking-panel.component.html',
  styleUrl: './banking-panel.component.scss'
})
export class BankingPanelComponent {

  displayedColumns = ['position', 'bankName', 'accId','status','Operation' ];
  dataSource : any[];
  banks: any[] = [];
  allocatedBanks: any[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
 
  loader: boolean = false;
  activeAccount: number =0;
 
  activeList: BankAccount[];
  currentdepo: number = 0;
  bankingTableArray:any[];
  FreezList:BankAccount[];
  constructor(
    public dialog: MatDialog,
    public paginatorServ : PaginatorService,
    private landingservice : SuperAdminLandingService,
    private depositsuperadminserv : DepositSuperadminService,
    private titleService : ComponettitleService,
    private  BankingService :BankingService,
    private snackbarService: SnackbarService,
    private slotsService : SlotService,
    
    
  ) {}
  @ViewChild('fileInput') fileInput: ElementRef;
  
    
  ngOnInit(): void {
    this.refreshAllData();
    this.titleService.changeTitle('Banking');
    this.refreshInterval = setInterval(() => this.refreshAllData(), 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refreshInterval: any;

  refreshAllData(): void {
    this.BankingService.getAllBankdata();
    this.fetchBanks();
 
    this.fetchActiveBanksCount();
    this.fetchAllocatedBanksByCurrentTime();

  
  }

  getCurrentTimeString(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  fetchAllocatedBanksByCurrentTime(): void {
    const time = this.getCurrentTimeString();
    this.BankingService.getAvailableBanksByTimeSorted(time).subscribe(
      (data) => {
        this.allocatedBanks = data;
      },
      (error) => {
        console.error('Error fetching allocated banks by time:', error);
      }
    );
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '80%';
    dialogConfig.data = {
      initialData: "ADD",
      userId: null,
    };
    const dialogRef = this.dialog.open(AddBankingDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshAllData();
    });
  }

  openUpdateBank(bank: any) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '80%';
    dialogConfig.data = {
      initialData: "UPDATE",
      operation: bank,
      bankList: this.banks,
    };
    const dialogRef = this.dialog.open(AddBankingDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshAllData();
    });
  }

  openBankSlots() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '50%';
    const dialogRef = this.dialog.open(AddslotdailogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshAllData();
    });
  }

  openAmountRange() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '50%';
    const dialogRef = this.dialog.open(AmountRangeDailogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      this.refreshAllData();
    });
  }

  fetchBanks(): void {
    // this.loader=true;
    this.BankingService.getAllBankdata().subscribe(
      data => {
        this.dataSource = data;
        this.bankingTableArray=data;
        this.loader=false;
        // this.dataSource.shift();
   

      },
      error => {
        console.error('Error fetching banks', error);
        this.loader=false;
      }
    );
  }

  fetchActiveBanksCount(): void {
    this.BankingService.getCountAllBotAccount().subscribe(
      data => {
        this.activeAccount = data;
       
      },
      error => {
        console.error('Error fetching banks', error);
      }
    );
  }

  unlinked(id: any) {
    this.loader=true;
    this.slotsService.unlinkSlotAmount(id).subscribe(
      Response => {
        this.snackbarService.snackbar('unlinked successfully!', 'success');
        this.loader=false;
       
      },
      error => {
        console.error('Error fetching banks', error);
        this.loader=false;
      }
    );

  }

  openCheckBank() {
    const dialogRef = this.dialog.open(CheckbankAccountComponent, {
      width: '800px',
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshAllData();
    });
  }

  filterData(searchTerm: string) {
    this.dataSource = this.bankingTableArray.filter(item =>
      item.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bankHolderName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  toggleStatus(id: number) {
    const isConfirmed = confirm('Do you really want change status ?');
  
    if (isConfirmed) {
      this.loader = true;
      this.BankingService.switch(id).subscribe(
        (data) => {
          this.loader = false;
          this.snackbarService.snackbar('Success: status changed', 'success');
          this.refreshAllData();
        },
        (error) => {
          console.log(error);
          this.loader = false;
        }
      );
    } else {
      console.log('Deletion canceled by the user.');
    }
    
  }

  openDialogAttach(bank): void {
    const dialogRef = this.dialog.open(AttachedslotrangeComponent, {
      width: '400px',
      data: bank,
    });
    dialogRef.afterClosed().subscribe(result => {
      this.refreshAllData();
    });
  }
}
