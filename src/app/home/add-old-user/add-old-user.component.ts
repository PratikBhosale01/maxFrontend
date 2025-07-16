import { Component, ElementRef, ViewChild } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import Tesseract from 'tesseract.js';
import { DepositeWithdraw } from '../../domain/Deposite';
import { ModalService } from '../../services/modal.service';
import { OperationsService } from '../../services/operations.service';
import { SiteService } from '../../services/site.service';
import { SITE, sites } from '../../domain/Site';
import {
  SiteMaster,
  masterJoker,
  masters777Exch,
  mastersCrex247,
  mastersWood,
  mastersWorld,
} from '../../domain/SiteMaster';
import { UtrService } from '../../services/utr.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ComponettitleService } from '../../services/componenttitle.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ReportService } from '../../services/report.service';
import { Subscription, debounceTime, fromEvent, interval } from 'rxjs';
import { RetryService } from '../../services/retry.service';
import { Operation } from '../../domain/operation';
import { DialogComponent } from '../../shared/dialog/dialog.component';

@Component({
  selector: 'app-add-old-user',
  templateUrl: './add-old-user.component.html',
  styleUrl: './add-old-user.component.scss'
})
export class AddOldUserComponent {
  formGroup: FormGroup;

  ocrResult: string = '';
  imagePath: string = '';
  imageStatus: string = 'Select or drag UTR Image';
  loader: boolean = false;
  DeposteWithdraw: DepositeWithdraw;
  buttonName: string = 'Deposit';
  user: any = {};
  sites: SITE[] = sites;
  siteMaster: SiteMaster[];
  userIdPrefix: string = '';
  hide = true;
  typingTimer: any;
  doneTypingInterval = 500;
  formValid = false;
  loader1 = false;
  loader2 = false;
  displayedColumns: string[] = ['userName', 'status', 'retry'];
  dataSource: any[] = [];
  Operator: number;
  private subscription: Subscription;
  operations: Operation[];

  constructor(
    private site: SiteService,
    private fb: FormBuilder,
    private operation: OperationsService,
    private _snackBar: MatSnackBar,
    private modalService: ModalService,
    private elementRef: ElementRef,
    private report: ReportService,
    private utrservice: UtrService,
    private snackbarService: SnackbarService,
    private titleService: ComponettitleService,
    private retryserv: RetryService,
    public dialog: MatDialog
  ) {}
  @ViewChild('fileInput') fileInput: ElementRef;
  utrNumberImageFileName: '';
  prograsbar: boolean = false;
  pBarPecentage: number = 0;
 
  ngOnInit(): void {
    this.titleService.changeTitle('Add Old User');
   
    this.myFormValues();
    const currentDate = new Date();
    this.formGroup.get('date').setValue(currentDate);
    this.getuserID();
   
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  

  openFileInput(): void {
    this.fileInput.nativeElement.click();
  }
  myFormValues(): void {
   
      this.formGroup = this.fb.group({
        userId: ['', []],
        password: ['', []],
        name: ['', []],
        balance: ['0'],
        creditReference: ['0'],
        site_id: ['', Validators.required],
        masterId: [''],
        betStatus: [false],
        activeStatus: [false],
        id: ['0'],
        zuserId: [''],
        date: [new Date()],
        utrNumber: [''],
      });
  
  }
  get utrNumber() {
    return this.formGroup.get('utrNumber');
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
        this.onUTRInput(transactionID);
        this.imageStatus = 'UTR Fetched Successfully';
        this.onUTRInput(transactionID);
      } else {
        this.imageStatus = 'UTR Failed';
        this.formGroup.patchValue({
          utrNumber: ' ',
        });
      }
    } catch (error) {
      this.snackbarService.snackbar('Error recognizing text!', 'error');
     
    }
  }
  onSubmit() {
   
    const userData = localStorage.getItem('user');
    if (this.formGroup.valid) {
      
      if (userData) {
        this.user = JSON.parse(userData);
      } else {
      }
      const id = this.user.user_id;

      this.prograsbar = true;
      this.formGroup.patchValue({ zuserId: id });

      this.increaseProgressBar();
      
      
    
        this.operation.addUserToDatabase(this.formGroup.value).subscribe(
          (data) => {
            this.snackbarService.snackbar(
              `added user to database successfully with name ${this.formGroup.value.userId} `,
              'success'
            );
            this.prograsbar = false;
            this.pBarPecentage = 0;
            this.resetForm();
          },
          (error) => {
            this.prograsbar = false;
            this.pBarPecentage = 0;
            this.snackbarService.snackbar('failed to add user!', 'error');

            // confirm(error.error.message);
          }
        );
   
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

  resetForm() {
    // Reset form controls
    this.formGroup.reset();

    // Mark the form as pristine and untouched
    this.formGroup.markAsPristine();
    this.formGroup.markAsUntouched();

    // Clear errors for each control
    Object.values(this.formGroup.controls).forEach((control) => {
      control.setErrors(null);
    });
  }
  onSiteSelectionChange(event: any): void {
    this.formGroup.patchValue({
      userId: '',
    });
    const selectedSiteId = event.value;
    switch (selectedSiteId) {
      case 1:
        this.siteMaster = masterJoker;
        break;
      case 2:
        this.siteMaster = mastersWorld;
        break;
      case 3:
        this.siteMaster = mastersWood;
        break;

      case 4:
        this.siteMaster = masters777Exch;
        break;

      case 5:
        this.siteMaster = mastersCrex247;
        break;
    }
  }
  subscribeToSiteSelection(): void {
    this.formGroup
      .get('site_id')
      .valueChanges.subscribe((selectedSiteId: number) => {
        const selectedSite = this.sites.find(
          (site) => site.id === selectedSiteId
        );

        if (selectedSite) {
          this.userIdPrefix = this.getPrefix(selectedSiteId);
          const userIdControl = this.formGroup.get('userId');
          const currentUserId = userIdControl.value;
          if (currentUserId && !currentUserId.startsWith(this.userIdPrefix)) {
            userIdControl.setValue(this.userIdPrefix + currentUserId);
          } else if (!currentUserId) {
            userIdControl.setValue(this.userIdPrefix);
          }
        }
      });
  }

  getPrefix(selectedSiteId: number): string {
    switch (selectedSiteId) {
      case 2:
        return 'w7';
      case 3:
        return 'w2';
      case 4:
        return '7e';
      default:
        return '';
    }
  }

  onUserIdChange(event: Event): void {

      const userIdControl = this.formGroup.get('userId');
      let currentUserId = userIdControl.value;
      if (!currentUserId.startsWith(this.userIdPrefix)) {
        currentUserId =
          this.userIdPrefix + currentUserId.substring(this.userIdPrefix.length);
        userIdControl.setValue(currentUserId);
      } else if (currentUserId.length > this.userIdPrefix.length) {
        const charactersAfterPrefix = currentUserId.substring(
          this.userIdPrefix.length
        );
      }
   
  }
  onUTRInput(utrValue: string) {
    this.loader2 = true;
    if (utrValue.length > 0) {
      this.utrservice.checkUtr(utrValue).subscribe(
        () => {
          // Success
          this.loader2 = false;
          this.formGroup.get('utrNumber').setErrors(null);
        },
        (error) => {
          this.loader2 = false;
          this.formGroup.get('utrNumber').setErrors({ utrExists: true });
        }
      );
    }
  }
  onInput(event: any) {
    const inputElement: HTMLInputElement = event.target;
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.onUTRInput(inputElement.value);
    }, this.doneTypingInterval);
  }
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Handle dropped files
      this.handleFiles(files);
    }
  }
  handleFiles(files: FileList) {
    // Process dropped files

    if (files && files.length > 0) {
      // Call onFileSelected function with the first file from the FileList
      this.onFileSelected({ target: { files: [files[0]] } });
    }
  }
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      this.recognizeText(imageUrl);
    } else {
    }
  }
  passwordValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const value: string = control.value;

    // Check if the value is null or undefined
    if (value == null) {
      return null;
    }

    // Perform password validation
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const minLength = value.length >= 8;

    // Check if all criteria are met
    if (hasUpperCase && hasLowerCase && hasNumber && minLength) {
      return null; // Return null if validation passes
    }

    // Return validation error object if any criteria fails
    return { invalidPassword: true };
  }

  checkUser(username: string) {
    this.loader1 = true;
    this.operation.checkUser(username).subscribe(
      () => {
        this.formGroup.get('userId').setErrors(null);
        this.loader1 = false;
      },
      (error) => {
        this.formGroup.get('userId').setErrors({ userExists: true });

        this.loader1 = false;
      }
    );
  }

  onUserInput(event: any) {
    const inputElement: HTMLInputElement = event.target;
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.checkUser(inputElement.value);
    }, this.doneTypingInterval);
  }
 

  retry(op: any) {
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
    const isConfirmed = confirm('Do you really want to delete this report?');
    if (isConfirmed) {
      this.prograsbar = true;

      this.retryserv.deleteReport(id).subscribe(
        (data) => {
          this.snackbarService.snackbar('Success: Report deleted', 'success');
          this.prograsbar = false;
        },
        (error) => {
          this.snackbarService.snackbar('failed!', 'error');
          this.prograsbar = false;
        }
      );
    } else {
      this.snackbarService.snackbar('Deletion canceled by the user!', 'error');
      
    }
  }
  // getAddUser() {
  //   this.report.getAddNewReport(this.Operator).subscribe(
  //     (data) => {
  //       // this.dataSource=this.operations;
  //       this.dataSource = data;
  //       this.operations = data;
  //     },
  //     (error) => {
  //       this.snackbarService.snackbar('failed!', 'error');
  //     }
  //   );
  // }
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
    // dialogConfig.data = this.operations;
    dialogConfig.data = {
      userId: this.Operator,
      initialData: 'Deposit',
      operation: this.operations,
    };

   
    const dialogRef = this.dialog.open(DialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
     
    });
  }

}