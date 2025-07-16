import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import Tesseract from 'tesseract.js';
import { DepositeWithdraw } from '../../domain/Deposite';
import { SITE } from '../../domain/Site';
import { SiteMaster } from '../../domain/SiteMaster';
import { OperationsService } from '../../services/operations.service';
import { SiteService } from '../../services/site.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalService } from '../../services/modal.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UtrService } from '../../services/utr.service';
import { Operation, Operations } from '../../domain/operation';
import { ReportService } from '../../services/report.service';
import { interval } from 'rxjs';
import { SnackbarService } from '../../services/snackbar.service';
import { RetryService } from '../../services/retry.service';

@Component({
  selector: 'app-dw-modal',

  templateUrl: './dw-modal.component.html',
  styleUrl: './dw-modal.component.scss',
})
export class DWModalComponent {
  sites: SITE[];
  formGroup: FormGroup;
  masters: SiteMaster[];
  ocrResult: string = '';
  imagePath: string = '';
  imageStatus: string = 'Click to select UTR Image';
  loader: boolean = false;
  DeposteWithdraw: DepositeWithdraw; 
  user: any = {};
  typingTimer: any;
  doneTypingInterval = 500;
  loader1 = false;
  loader2: boolean;
  operations: Operation[] = Operations;
  displayedColumns: string[] = ['userName', 'status'];
  dataSource: Operation[] =[];
  Operator: number;
  subscription: any;
  userId: string;
  buttonName: string = '';

  constructor(
    private snackbarService: SnackbarService,
    private site: SiteService,
    private fb: FormBuilder,
    private operation: OperationsService,
    private _snackBar: MatSnackBar,
    private modalService: ModalService,
    private utrservice: UtrService,
    private retryserv : RetryService ,
    private report: ReportService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    
    this.buttonName = data.initialData ;
    this.userId = data.userId ;
    console.log(data.initialData); // This will log "Deposit"
    console.log(data.userId); 
  }
  utrNumberImageFileName: '';
  prograsbar: boolean = false;
  pBarPecentage: number = 0;
  ngOnInit(): void {

    this.myFormValues(this.userId);
    this.getuserID();
    this.getReport();
    // this.dataSource=this.operations;
    this.subscription = interval(5000).subscribe(() => {
      this.getReport();
    });
   
  }

  getReport(){
    if(this.buttonName == 'Deposit'){
      this.getDeposite();
    }else{
      this.getWithdraw();
    }
  }


  getWithdraw(){
    
    this.report.getWithdrawReport(this.Operator).subscribe(
      (data) => {
        
        this.dataSource=data;
        // this.dataSource=this.operations;
  
      },
      (error) => {
        console.error(error);
      }
    );
  }
  getDeposite() {
    this.report.getDepositeReport(this.Operator).subscribe(
      (data) => {
        // this.dataSource=this.operations;
        this.dataSource = data;
        this.operations=data;
      },
      (error) => {
        console.error(error);
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

// ===========replaced==============
  // myFormValues() {
  //   this.formGroup = this.fb.group({
  //     siteId: ['', Validators.required],
  //     dtoSiteMaster: ['', Validators.required],
  //     utrNumber: ['', [Validators.required, Validators.minLength(12)]],
  //     userId: ['', [Validators.required, Validators.minLength(6)]],
  //     amount: ['', [Validators.required, Validators.min(0.01)]],
  //     zuserId: [''],
  //     siteMasterTotalAmount: [''],
  //     date: [new Date()],
  //   });
  // }
  // myFormValues() {
  //   this.formGroup = new FormGroup({
  //     utrNumber: new FormControl('', [
       
  //       Validators.maxLength(12),
  //     ]),
  //     userId: new FormControl('', [
  //       Validators.required,
  //       Validators.minLength(4),
  //     ]),
  //     amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
  //     id: new FormControl(''),
  //     siteMasterTotalAmount: new FormControl(''),
  //     date: new FormControl(),
  //   });
  // }


  myFormValues(userIdValue: string | null) {
    const isUserIdProvided = !!userIdValue;
    this.formGroup = new FormGroup({
        utrNumber: new FormControl('', [
            Validators.maxLength(12),
        ]),
      userId: new FormControl(userIdValue, [ // Use userIdValue if it exists, otherwise use an empty string
            Validators.required,
            Validators.minLength(4),
        ]),
        amount: new FormControl('', [Validators.required, Validators.min(0.01), Validators.pattern('^[0-9]+(\.[0-9]+)?$')]),
        id: new FormControl(''),
        siteMasterTotalAmount: new FormControl(''),
        date: new FormControl(),
    });
    // this.formGroup.get('userId').valueChanges.subscribe((value: string) => {
    //   // Convert value to lowercase and assign it back to the FormControl
    //   this.formGroup.get('userId').setValue(value.toLowerCase(), { emitEvent: false });
      
    // });

}


//===================replaced==========
  // onFileSelected(event: any) {
  //   this.loader = true;
  //   const file: File = event.target.files[0];
  //   if (file) {
  //     const imageUrl = URL.createObjectURL(file);
  //     this.recognizeText(imageUrl);
  //   } else {
  //     this.loader = false;
  //   }
  // }
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
  //  ======================
  get utrNumber() {
    return this.formGroup.get('utrNumber');
  }
  
  public onFilesChange(files: any) {
    for (const droppedFile of files) {
      // Check if the dropped file is a file
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          // Handle the dropped file here
        });
      }
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
  onSubmit() {
    const userData = localStorage.getItem('user');
    const currentDate = new Date();
    this.formGroup.patchValue({ date: currentDate });
    if (userData) {
      this.user = JSON.parse(userData);
    } else {
      console.error('User data not found in localStorage');
      return;
    }
    const id = this.user.user_id;
    if (this.formGroup.valid) {
      console.log("formvalid");
      this.formGroup.patchValue({ id: id });
      console.log('Form submitted with value:', this.formGroup.value);
      // Start increasing the progress bar
      this.increaseProgressBar();
      if (this.buttonName == 'Deposit') {
        console.log('Form submitted with');
        this.operation.deposite(this.formGroup.value).subscribe(
          (data) => {
            console.log(data);
            this.snackbarService.snackbar('Deposit Request Received', 'success');
            this.prograsbar = false;
            this.pBarPecentage = 0;
            // this.modalService.closeModal();
          },
          (error) => {
            this.prograsbar = false;
            this.pBarPecentage = 0;
            console.log(error);
            confirm(error.error.message);
          }
        );
      } else {
        this.operation.withdraw(this.formGroup.value).subscribe(
          (data) => {
            console.log(data);
           
          },
          (error) => {
         
            console.log(error);
            
           
          }
        );
      }
    }
  }
  increaseProgressBar() {
    const incrementValue = 1;
    const totalTime = 9000;
    const intervalTime = totalTime / (100 / incrementValue);

    const interval = setInterval(() => {
      this.pBarPecentage += incrementValue;
      if (this.pBarPecentage >= 100) {
        clearInterval(interval);
      }
    }, intervalTime);
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
  resetForm() {
    this.formGroup.reset(); // Reset form values
    this.formGroup.markAsPristine(); // Mark form as pristine
    this.formGroup.markAsUntouched(); // Mark form as untouched
    Object.values(this.formGroup.controls).forEach((control) => {
      control.setErrors(null); // Reset validation errors for each control
    });
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
// ===========replaced==============
  // extractTransactionID(details: string) {
  //   let idMatch = details.match(/UPI transaction ID\s+(\d+)/);
  //   if (idMatch) {
  //   } else {
  //     idMatch = details.match(/\b\d{12}\b/);
  //     return idMatch ? idMatch[0] : null;
  //   }

  //   return idMatch ? idMatch[1] : null;
  // }
  extractTransactionID(details: string) {
    let idMatch = details.match(/UPI transaction ID\s+(\d+)/);
    if (idMatch) {
    } else {
      idMatch = details.match(/\b\d{12}\b/);
      return idMatch ? idMatch[0] : null;
    }

    return idMatch ? idMatch[1] : null;
  }

  // =====================why? =====================
  closeModal(): void {
    this.modalService.closeModal();
  }

  retry(op :Operation){
    this.prograsbar=true;
   this.retryserv.postRetry(op).subscribe( (data) => {
     this.snackbarService.snackbar('success Retry', 'success');
     this.prograsbar=false;

   (error) => {
    
     confirm(error.error.message);
   }

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
        console.log(error)
        this.prograsbar = false;
      }
    );
  } else {
    // If the user cancels the confirmation, do nothing
    console.log('Deletion canceled by the user.');
  }
}
}
