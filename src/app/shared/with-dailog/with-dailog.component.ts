import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, interval } from 'rxjs';
import Tesseract from 'tesseract.js';
import { DepositeWithdraw } from '../../domain/Deposite';
import { Operation } from '../../domain/operation';
import { ComponettitleService } from '../../services/componenttitle.service';
import { ModalService } from '../../services/modal.service';
import { OperationsService } from '../../services/operations.service';
import { ReportService } from '../../services/report.service';
import { RetryService } from '../../services/retry.service';
import { SiteService } from '../../services/site.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { DialogComponent } from '../dialog/dialog.component';
import { SlipComponent } from '../slip/slip.component';
import { WithdrawConfirmComponent } from '../withdraw-confirm/withdraw-confirm.component';
import { BankingService } from '../../services/banking.service';
@Component({
  selector: 'app-with-dailog',
  templateUrl: './with-dailog.component.html',
  styleUrl: './with-dailog.component.scss'
})
export class WithDailogComponent  implements OnInit, OnDestroy {
    formGroup: FormGroup;
  
    ocrResult: string = '';
    imagePath: string = '';
    imageStatus: string = 'Select or drag UTR Image';
    loader: boolean = false;
    DeposteWithdraw: DepositeWithdraw;
    buttonName: string = 'Deposit';
    user: any = {};
    typingTimer: any;
    doneTypingInterval = 500;
    loader1 = false;
    loader2: boolean;
    banks: any[] = [];
    // -------table----------
  
    displayedColumns: string[] = ['userName', 'amount', 'status', 'retry'];
    dataSource: Operation[] = [];
    private subscription: Subscription;
  
    constructor(
      public dialog: MatDialog,
      private site: SiteService,
      private fb: FormBuilder,
      private report: ReportService,
      private operation: OperationsService,
      private _snackBar: MatSnackBar,
      private modalService: ModalService,
      private snackbarService: SnackbarService,
      private retryserv: RetryService,
      private titleService: ComponettitleService,
      private BankingService: BankingService
    ) {}
  
    @ViewChild('fileInput') fileInput: ElementRef;
    utrNumberImageFileName: '';
    prograsbar: boolean = false;
    Operator: number;
    pBarPecentage: number = 0;
    ngOnInit(): void {
      this.titleService.changeTitle('Withdraw');
      this.myFormValues();
      this.getuserID();
      this.getWithdraw();
  
      this.subscription = interval(5000).subscribe(() => {
        this.getWithdraw();
      });
    }
    ngOnDestroy(): void {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    }
    getWithdraw() {
      this.report.getWithdrawReport(this.Operator).subscribe(
        (data) => {
          this.dataSource = data;
        },
        (error) => {
          console.error(error);
        }
      );
    }
  
    openFileInput(): void {
      this.fileInput.nativeElement.click();
    }
    myFormValues() {
      this.formGroup = this.fb.group({
        userId: ['', [Validators.required, Validators.minLength(4)]],
        amount: [
          '',
          [
            Validators.required,
            Validators.min(0.01),
            Validators.pattern('^[0-9]+(.[0-9]+)?$'),
          ],
        ],
        id: [''],
        // bankId: [''],
        // date: [],
      });
      this.fetchBanks();
    }
    onFileSelected(event: any) {
      this.loader = true;
  
      const file: File = event.target.files[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        this.recognizeText(imageUrl);
      } else {
        this.loader = false;
      }
    }
    async recognizeText(url: string) {
      try {
        const imageUrl = new URL(url);
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const result = await Tesseract.recognize(blob);
        const transactionID = this.extractTransactionID(result.data.text);
        if (transactionID) {
          this.formGroup.patchValue({
            utrNumber: transactionID,
          });
          this.imageStatus = 'UTR Fetched Successfully';
        } else {
          this.imageStatus = 'UTR Failed';
          this.formGroup.patchValue({
            utrNumber: ' ',
          });
        }
        this.loader = false;
      } catch (error) {
        console.error('Error recognizing text:', error);
      }
    }
  
    getLocalDateTime() {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const localDateTime = new Date().toLocaleString('en-US', {
        timeZone: timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
  
      // Convert to the desired format (YYYY-MM-DD hh:mm:ss A)
      const [date, time, period] = localDateTime.split(/, | /);
      const [month, day, year] = date.split('/');
      const formattedDateTime = `${year}-${month}-${day} ${time} ${period}`;
  
      return formattedDateTime;
    }
  
    onSubmit(event: Event) {
      event.preventDefault();
      const currentDate = this.getLocalDateTime();
      const userData = localStorage.getItem('user');
      this.formGroup.patchValue({ date: currentDate });
  
      if (userData) {
        this.user = JSON.parse(userData);
      } else {
      }
      const id = this.user.user_id;
  
      if (this.formGroup.valid) {
        const amount = this.formGroup.value.amount;
        const userId = this.formGroup.value.userId;
        const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
          width: '400px',
          data: { amount, userId },
        });
        dialogRef.afterClosed().subscribe((isConfirmed) => {
          if (isConfirmed) {
            this.prograsbar = true;
            this.formGroup.patchValue({ id: id });
  
            // Start increasing the progress bar
            this.increaseProgressBar();
  
            this.operation.withdraw(this.formGroup.value).subscribe(
              (data) => {
                this.getWithdraw();
                this.snackbarService.snackbar(
                  'Withdraw Request Recviced',
                  'success'
                );
                // this._snackBar.open('Withdraw Request Recviced', 'Close', {
                //   duration: 3000,
                //   horizontalPosition: 'center',
                //   verticalPosition: 'top',
                //   panelClass: ['success-snackbar'],
                // });
                this.prograsbar = false;
                this.pBarPecentage = 0;
                this.resetForm();
              },
              (error) => {
                this.prograsbar = false;
                this.pBarPecentage = 0;
  
                confirm(error.error.message);
              }
            );
          }
        });
      }
    }
    increaseProgressBar() {
      const incrementValue = 1;
      const totalTime = 18000;
      const intervalTime = totalTime / (100 / incrementValue);
  
      const interval = setInterval(() => {
        this.pBarPecentage += incrementValue;
        if (this.pBarPecentage >= 100) {
          clearInterval(interval);
        }
      }, intervalTime);
      this.pBarPecentage = 0;
    }
  
    extractTransactionID(details: string) {
      let idMatch = details.match(/UPI transaction ID\s+(\d+)/);
      if (idMatch) {
      } else {
        idMatch = details.match(/\b\d{12}\b/);
        return idMatch ? idMatch[0] : null;
      }
  
      return idMatch ? idMatch[1] : null;
    }
    fetchBanks(): void {
      this.BankingService.getAllAccountdata().subscribe(
        (data) => {
          this.banks = data;
        },
        (error) => {
          console.error('Error fetching banks', error);
        }
      );
    }
  
    resetForm() {
      this.formGroup.reset(); // Reset form values
      this.formGroup.markAsPristine(); // Mark form as pristine
      this.formGroup.markAsUntouched(); // Mark form as untouched
      Object.values(this.formGroup.controls).forEach((control) => {
        control.setErrors(null); // Reset validation errors for each control
      });
    }
    onUserInput(event: any) {
      const inputElement: HTMLInputElement = event.target;
      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.checkUser(inputElement.value);
      }, this.doneTypingInterval);
    }
    checkUser(username: string) {
      this.loader1 = true;
      this.operation.checkUser(username).subscribe(
        () => {
          this.formGroup.get('userId').setErrors({ userExists: true });
          this.loader1 = false;
        },
        (error) => {
          this.formGroup.get('userId').setErrors(null);
  
          this.loader1 = false;
        }
      );
    }
    getuserID() {
        let userString = localStorage.getItem('user');
    if (!userString) {
      userString = sessionStorage.getItem('user');
    }
      if (userString) {
        // Step 2: Access user_role attribute
        const user = JSON.parse(userString);
        this.Operator = user.user_id;
      }
    }
  
    openDialog() {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.width = '80%';
      // dialogConfig.data = this.dataSource;
      dialogConfig.data = {
        initialData: 'Withdraw',
        operation: this.dataSource,
      };
      console.log('in dialog');
      const dialogRef = this.dialog.open(DialogComponent, dialogConfig);
      dialogRef.afterClosed().subscribe((result) => {
        console.log(`Dialog result: ${result}`);
      });
    }
  
    retry(op: Operation) {
      this.prograsbar = true;
      this.retryserv.postRetry(op).subscribe((data) => {
        this.snackbarService.snackbar('success Retry', 'success');
        this.prograsbar = false;
  
        (error) => {
          confirm(error.error.message);
        };
      });
    }
    deleteReport(id: number) {
      // Show a confirmation dialog
      const isConfirmed = confirm('Do you really want to delete this report?');
  
      if (isConfirmed) {
        this.prograsbar = true;
  
        this.retryserv.deleteReport(id).subscribe(
          (data) => {
            this.snackbarService.snackbar('Success: Report deleted', 'success');
            this.prograsbar = false;
          },
          (error) => {
            console.log(error);
            this.prograsbar = false;
          }
        );
      } else {
        // If the user cancels the confirmation, do nothing
        console.log('Deletion canceled by the user.');
      }
    }
    //====================================================
    onKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter' && this.formGroup.value.amount > 0) {
        this.onSubmit(event);
      }
    }
    //=====================slip =================
    openDepositDialog(element): void {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.width = '52%';
      dialogConfig.data = {
        type: 'WITHDRAW',
        data: element,
      };
      const dialogRef = this.dialog.open(SlipComponent, dialogConfig);
    }
  
    openWithdrawConf(Id: any) {
      console.log(Id +"withdraw id");
      const dialogConfig = new MatDialogConfig();
      dialogConfig.width = '32%';
      dialogConfig.data = {
        type: 'WITHDRAW',
        id: Id,
      };
      const dialogRef = this.dialog.open(WithdrawConfirmComponent, dialogConfig);
      }

}
