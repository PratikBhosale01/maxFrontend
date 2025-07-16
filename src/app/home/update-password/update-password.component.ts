import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DepositeWithdraw } from '../../domain/Deposite';
import { OperationsService } from '../../services/operations.service';
import { SiteService } from '../../services/site.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ComponettitleService } from '../../services/componenttitle.service';
import { Operation } from '../../domain/operation';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { RetryService } from '../../services/retry.service';
import { SlipComponent } from '../../shared/slip/slip.component';
import { interval, Subscription } from 'rxjs';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-update-password',
  templateUrl: './update-password.component.html',
  styleUrl: './update-password.component.scss',
})
export class UpdatePasswordComponent {
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
  dataSource: Operation[] = [];
  Operator: number;
  operations: Operation[] = [];
  displayedColumns: string[] = ['userName', 'status', 'retry'];
  private subscription: Subscription;

  constructor(
    private site: SiteService,
    private fb: FormBuilder,
    private operation: OperationsService,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog,
    private snackbarService: SnackbarService,
    private titleService: ComponettitleService,
    private retryserv: RetryService,
    private report: ReportService
  ) {}
  @ViewChild('fileInput') fileInput: ElementRef;
  utrNumberImageFileName: '';
  prograsbar: boolean = false;
  pBarPecentage: number = 0;
  ngOnInit(): void {
    this.titleService.changeTitle('Update password');
    this.myFormValues();
    this.getuserID();
    this.getDeposite();
    this.subscription = interval(5000).subscribe(() => {
      this.getDeposite();
    });
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
  myFormValues() {
    this.formGroup = this.fb.group({
      userId: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.min(0.01)]],
      id: [''],
    });
  }
  getDeposite() {
    this.report.getUpdateReport(this.Operator).subscribe(
      (data) => {
        // this.dataSource=this.opertions;
        this.dataSource = data;
        this.operations = data;
      },
      (error) => {
        console.error(error);
      }
    );
  }

  onSubmit() {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
    } else {
    }
    const id = this.user.user_id;
    this.formGroup.patchValue({ id: id });
    this.prograsbar = true;
    this.increaseProgressBar();

    this.operation.updatePassword(this.formGroup.value).subscribe(
      (data) => {
        this.snackbarService.snackbar(
          'Password Succesfully Updated',
          'success'
        );
        // this._snackBar.open('Password Updated Succesfully', 'Close', {
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
        this.pBarPecentage = 0;
        this.prograsbar = false;

        confirm(error.error.message);
      }
    );
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
  openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '80%';
    // dialogConfig.data = this.operations;
    dialogConfig.data = {
      userId: this.Operator,
      initialData: 'Update',
      operation: this.operations,
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
  //====================slip======
  openDepositDialog(element): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '52%';
    dialogConfig.data = {
      type: 'Update',
      data: element,
    };
    const dialogRef = this.dialog.open(SlipComponent, dialogConfig);
  }
}
