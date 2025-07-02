import { Component, Inject, SimpleChanges, ViewChild, ElementRef} from '@angular/core';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import { Operation, Operations } from '../../domain/operation';
import { RetryService } from '../../services/retry.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ReportService } from '../../services/report.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BankingService } from '../../services/banking.service';
import { BankAccount } from '../../domain/Bank';
import { SlotService } from '../../services/slot.service';

@Component({
  selector: 'app-add-banking-dialog',
  templateUrl: './add-banking-dialog.component.html',
  styleUrl: './add-banking-dialog.component.scss'
})
export class AddBankingDialogComponent {
  prograsbar: boolean = false;
  bankdetail: any;
  operation: string;
  operator: number;
  displayedColumns: string[];
  loader: boolean = false;
  qrImagePreview: string | null = null;
  selectedFile = null;
  isDragging: boolean = false;
  @ViewChild('fileInput') fileInput: ElementRef;
  selectedImageUrl: string;
  amountRanges:any;
  slots: { isEditing: boolean; id?: number; startTime?: string; endTime?: string; }[];
  selectedSlot: any;
  selectedAmountRange: any;
  deviceName:any;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any,
    private retryserv : RetryService,
    private snackbarService:SnackbarService,
    private fb: FormBuilder,
    private bank:BankingService,
    private slotService: SlotService,
  ) { 
    this.operator = data.userId;
    this.bankdetail=data.operation;
    this.operation=data.initialData;
    this.loadAmountRanges();
    this.loadDeviceNames();
    this.loadSlots();
   
    // this.selectedSlot = this.data.slot.id;
    // this.selectedAmountRange = this.data.amountRange.id;
    
  }

  bankFormGroup: FormGroup;

  ngOnInit(): void {
    this.bankFormGroup = this.fb.group({
      id: [''],
      displayName: ['', Validators.required],
      bankHolderName: [''],
      bankName: [''],
      accountNumber: [''],
      ifscCode: [''],
      gpayUPI: [''],
      phonePeUPI: [''],
      upiId: ['', Validators.required],
      active: [true],
      balance: [0, [Validators.required, Validators.min(0)]],
      branchName: [''],
      bankMessage: [''],
      slotId:[''],
      amountRangeId:[''],
      deviceName:['']
    });


    // // Handle NA selection for slots
    // this.bankFormGroup.get('slots').valueChanges.subscribe(value => {
    //   if (value === 0) {
    //     this.bankFormGroup.get('slots').setValue('', { emitEvent: false });
    //   }
    // });
    // // Handle NA selection for amountRanges
    // this.bankFormGroup.get('amountRanges').valueChanges.subscribe(value => {
    //   if (value === 0) {
    //     this.bankFormGroup.get('amountRanges').setValue('', { emitEvent: false });
    //   }
    // });

    if (this.operation === 'UPDATE' && this.bankdetail) {
      // Set form values from bankdetail
      this.bankFormGroup.patchValue({
        id: this.bankdetail.id,
        displayName: this.bankdetail.displayName,
        bankHolderName: this.bankdetail.bankHolderName,
        bankName: this.bankdetail.bankName,
        accountNumber: this.bankdetail.accountNumber,
        ifscCode: this.bankdetail.ifscCode,
        gpayUPI: this.bankdetail.gpayUPI,
        phonePeUPI: this.bankdetail.phonePeUPI,
        upiId: this.bankdetail.upiId,
        active: this.bankdetail.active,
        balance: this.bankdetail.balance,
        branchName: this.bankdetail.branchName,
        bankMessage: this.bankdetail.bankMessage,
       
        deviceName:this.bankdetail.deviceName,
        slotId: this.bankdetail.slots && this.bankdetail.slots.length > 0 ? this.bankdetail.slots[0].id : '',
        amountRangeId: this.bankdetail.amountRanges && this.bankdetail.amountRanges.length > 0 ? this.bankdetail.amountRanges[0].id : '',
       
      });

      // If there's an existing QR image, set it
      if (this.bankdetail.qrImageLink) {
        this.qrImagePreview = this.bankdetail.qrImageLink;
        console.log(this.qrImagePreview);
        // this.selectedImageUrl = this.qrImagePreview
        // console.log(this.selectedImageUrl);
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.handleFile(file);
      } else {
        this.snackbarService.snackbar('Please upload an image file', 'error');
      }
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.qrImagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeQRImage(): void {
    this.qrImagePreview = null;
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

 onBankSubmit(): void {
  if (this.bankFormGroup.valid) {
    this.loader = true;
    const formData = new FormData();

    // Clone the form value to manipulate safely
    const bankDetails = { ...this.bankFormGroup.value };

    // Check and replace 0 with "" for slotId and amountRangeId
    if (bankDetails.slotId === 0) {
      bankDetails.slotId = "";
    }
    if (bankDetails.amountRangeId === 0) {
      bankDetails.amountRangeId = "";
    }

    // Add bank details as JSON string
    formData.append('bankDto', JSON.stringify(bankDetails));

    // Add QR image if selected
    if (this.selectedFile) {
      formData.append('qrImage', this.selectedFile);
    }

    console.log(formData);
    this.bank.createBank(formData).subscribe(response => {
      this.snackbarService.snackbar('Account created successfully!', 'success');
      this.loader = false;
      this.resetForm();
    }, error => {
      this.snackbarService.snackbar('failed!', 'error');
      this.resetForm();
      this.loader = false;
      console.error('Error creating account:', error);
      confirm(error.error.message);
    });
  }
}


  onUpdate() {
    if (this.bankFormGroup.valid) {
      this.loader = true;
      const formData = new FormData();
      
      // Add bank details as JSON string
      const bankDetails = this.bankFormGroup.value;
      formData.append('bankDetails', JSON.stringify(bankDetails));
         if (bankDetails.slotId === 0) {
      bankDetails.slotId = "";
    }
    if (bankDetails.amountRangeId === 0) {
      bankDetails.amountRangeId = "";
    }
      // Add QR image if selected
      if (this.selectedFile) {
        formData.append('qrImage', this.selectedFile );
      }
      
      this.bank.updateBankAccount(formData, this.bankdetail.id).subscribe(
        (response) => {
          this.snackbarService.snackbar('Bank details updated successfully!', 'success');
          this.loader = false;
        },
        (error) => {
          console.error('Error updating bank details:', error);
          this.snackbarService.snackbar('Update failed!', 'error');
          this.loader = false;
        }
      );
    }
  }

  resetForm(): void {
    this.bankFormGroup.reset();
    this.removeQRImage();
  }

  onDropZoneClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.fileInput.nativeElement.click();
  }

  onChooseFileClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.fileInput.nativeElement.click();
  }

  openImage(imageUrl: string): void {
    this.selectedImageUrl = imageUrl;
  }

  closeImage(): void {
    this.selectedImageUrl = null;
  }

  loadAmountRanges(): void {
    this.loader=true;
    this.slotService.getAmountRanges().subscribe(data => {
      // Add NA option at the beginning
      this.amountRanges = [ ...data];
    }, error => {
      this.loader=false;
    });
  }

  loadDeviceNames(): void {
    this.loader=true;
    this.slotService.getdeviceNames().subscribe(data => {
      // Add NA option at the beginning
      this.deviceName = [ ...data];
      console.log(this.deviceName)
    }, error => {
      this.loader=false;
    });
  }

  loadSlots(): void {
    this.slotService.getSlots().subscribe(data => {
      // Add NA option at the beginning
      this.slots = [ ...data.map(slot => ({ ...slot, isEditing: false }))];
      this.loader=false;
    }, error => {
      this.loader=false;
    }
  );
  }
}
