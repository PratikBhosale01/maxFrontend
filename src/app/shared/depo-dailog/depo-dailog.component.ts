import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { OperationsService } from '../../services/operations.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ReportService } from '../../services/report.service';
import { Operation, Operations } from '../../domain/operation';
import { DialogComponent } from '../dialog/dialog.component';
import { SlipComponent } from '../slip/slip.component';
import { RetryService } from '../../services/retry.service';
import { interval } from 'rxjs';

@Component({
  selector: 'app-depo-dailog',
  templateUrl: './depo-dailog.component.html',
  styleUrl: './depo-dailog.component.scss'
})
export class DepoDailogComponent implements OnDestroy {
   formGroup: FormGroup;
  prograsbar: boolean;
  user: any = {};
  displayedColumns: string[] = ['userName', 'amount', 'status', 'retry'];
  Operator: number;
   operations: Operation[] = Operations;
   dataSource: Operation[] = [];
 
  pBarPecentage: number = 0;
loader1: any;
typingTimer: any;
  doneTypingInterval = 500;
  subscription: any;
  isTyping: any;

   constructor(
     public dialog: MatDialog,
            private operation: OperationsService,
             private snackbarService: SnackbarService,
              private report: ReportService,
               private retryserv: RetryService,
   ) {
    this.myFormValues();
    this.getuserID();
  //  this.formGroup = new FormGroup({});
  this.getDeposite();
   this.subscription = interval(1000).subscribe(() => {
    this.getDeposite();
  });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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
      console.log('User ID:', this.Operator);
    }
  }
 
  myFormValues() {
    this.formGroup = new FormGroup({
      utrNumber: new FormControl('NA', [
        Validators.required,
        // Validators.maxLength(12),
      ]),
      userId: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
      ]),
      amount: new FormControl('', [
        Validators.required,
        Validators.min(0.01),
        Validators.pattern('^[0-9]+(.[0-9]+)?$'),
      ]),
      bankId: new FormControl('0', [Validators.required]),
      id: new FormControl(''),
      date: new FormControl(),
      depositType: new FormControl('DEPOSIT', Validators.required),
    });}
  

   getDeposite() {
    this.report.getDepositeReport(this.Operator).subscribe(
      (data) => {
        // this.dataSource=this.operations;
        this.dataSource = data;
        this.operations = data;
      },
      (error) => {
        console.error(error);
      }
    );
  }

    onSubmit(event: Event) {
       event.preventDefault();
   
       //===========================
       
   
       // Find the bank in the banksList by bankName
      
   
       //===========================
       const userData = localStorage.getItem('user');
       const currentDate = this.getLocalDateTime(); // probleam
       this.formGroup.patchValue({ date: currentDate });
   
       if (userData) {
         this.user = JSON.parse(userData);
       } else {
         // Handle the case when user data is not available
         console.error('User data not found in localStorage');
         return;
       }
       const id = this.user.user_id;
   
       if (this.formGroup.valid) {
         // const isConfirmed = confirm(
         //   `Do you want to add amount ${this.formGroup.value.amount} to user ID ${this.formGroup.value.userId}?`
         // );
         const amount = this.formGroup.value.amount;
         const userId = this.formGroup.value.userId;
         const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
           width: '300px',
           data: { amount, userId },
         });
         dialogRef.afterClosed().subscribe((isConfirmed) => {
           if (isConfirmed) {
             this.prograsbar = true;
             this.formGroup.patchValue({ id: id });
             // double snackbar issue
             // this.snackbarService.snackbar('Deposite Request Received', 'success');
   
             this.increaseProgressBar();
             this.operation.deposite(this.formGroup.value).subscribe(
               (data) => {
                 this.getDeposite();
   
                 this.snackbarService.snackbar(
                   'Deposite Request Received',
                   'success'
                 );
   
                 this.prograsbar = false;
                 this.pBarPecentage = 0;
                 this.resetForm();
               },
               (error) => {
                 console.error(error);
                 this.prograsbar = false;
                 this.pBarPecentage = 0;
                 confirm(error.error.message);
               }
             );
           }
         });
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

    onKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter' && this.formGroup.value.amount > 0) {
        this.onSubmit(event);
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

   resetForm() {
       this.formGroup.reset(); // Reset form values
       this.formGroup.markAsPristine(); // Mark form as pristine
       this.formGroup.markAsUntouched(); // Mark form as untouched
   }

   openDialog() {
       const dialogConfig = new MatDialogConfig();
       dialogConfig.width = '80%';
       // dialogConfig.data = this.operations;
       dialogConfig.data = {
         userId: this.Operator,
         initialData: 'Deposit',
         operation: this.operations,
       };
   
      
       const dialogRef = this.dialog.open(DialogComponent, dialogConfig);
       dialogRef.afterClosed().subscribe((result) => {
         console.log(`Dialog result: ${result}`);
       });
     }
   openDepositDialog(element): void {
       const dialogConfig = new MatDialogConfig();
       dialogConfig.width = '52%';
       dialogConfig.data = {
         type: 'DEPOSIT',
         data: element,
       };
       const dialogRef = this.dialog.open(SlipComponent, dialogConfig);
     } 
     
     retry(op: Operation) {
      this.prograsbar = true;
      this.retryserv.postRetry(op).subscribe((data) => {
        this.snackbarService.snackbar('success Retry', 'success'); 
        this.getDeposite();
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
            this.getDeposite();
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
  

}
