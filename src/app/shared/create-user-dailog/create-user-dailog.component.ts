import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';
import { RejectconfirmationComponent } from '../rejectconfirmation/rejectconfirmation.component';
import { interval, map, Observable, of, Subscription } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Bank } from '../../domain/Bank';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { CheckAppvDailogComponent } from '../check-appv-dailog/check-appv-dailog.component';
import { ApproveService } from '../../services/approve.service';
import { BankingService } from '../../services/banking.service';
import { SnackbarService } from '../../services/snackbar.service';
import { UtrService } from '../../services/utr.service';
import { UTRDetailsPopupComponent } from '../utrdetails-popup/utrdetails-popup.component';
import { AppvDeposit } from '../../domain/Deposite';

@Component({
  selector: 'app-create-user-dailog',
  templateUrl: './create-user-dailog.component.html',
  styleUrl: './create-user-dailog.component.scss'
})
export class CreateUserDailogComponent {
  formGroup: FormGroup;
  bankIdControl!: FormControl;
  banksList: Bank[];
  filteredBanks: Observable<Bank[]>;
  userId: any;
  bankName;
  user;
  type;
  typingTimer: any;
  doneTypingInterval = 500;
  loader: boolean;
  isApproved: boolean;
  private subscription: Subscription;
  status: any;
  loader2: boolean;
  obj: AppvDeposit;
  retried: boolean;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CheckAppvDailogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apprvservice: ApproveService,
    private bank: BankingService,
    public dialog: MatDialog,
    private snackbarService: SnackbarService,
    private utrservice: UtrService,
    private apprvserv: ApproveService,
  ) {
    this.user = data.user;
    this.type = data.type;
    // this.status = data.user.approveStatus;
    this.getUserId();
    if (this.type === 'Deposit') {
      this.bankName = data.user.bank.bankName;
    }
    // Create form and prefill it with user data
    this.formGroup = this.fb.group({
      utrNumber: [data.user.utrNumber],
      amount: [data.user.amount],
      userId: [data.user.userId],
      newId: [data.user.isNewId],
    });

    // this.bankIdControl = this.formGroup.get('bankId') as FormControl;

    // this.filteredBanks = this.formGroup.controls['bankId'].valueChanges.pipe(

    //   map(value => this._filterBanks(value || ''))
    // );
    this.loadBanks();
  }

  ngOnInit(): void {
    this.getDepositApproveStatus();
    this.subscription = interval(5000).subscribe(() => {
      this.getDepositApproveStatus();
    });
    const utrNumberControl = this.formGroup.get('utrNumber');

    console.log('Add :' + this.type + 'Add :' + this.status);
    if (this.type === 'withdraw' && this.status === 'DONE') {
      // Add required validator if type is withdraw
      console.log('Add required validator');
      utrNumberControl.setValidators([Validators.required]);
    } else {
      // Remove required validator if type is not withdraw
      utrNumberControl.clearValidators();
    }
  }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getUserId() {
    const userData = localStorage.getItem('user');

    if (userData) {
      const zuser = JSON.parse(userData);
      this.userId = zuser.user_id; // Get the user ID from localStorage
    } else {
      // Handle the case when user data is not available
      console.error('User data not found in localStorage');
      return;
    }
  }

  onSave(): void {
      if (this.formGroup.valid) {
        const updatedData = this.formGroup.value;
        this.loader = true;
        this.apprvservice
          .Approvecheck(this.user.id, 0, this.userId, updatedData)
          .subscribe({
            next: (response) => {
              // console.log('Update successful', response);
              this.snackbarService.snackbar('Update successfully!', 'success');
              // this.dialogRef.close(response);
              this.isApproved = true;
              this.loader = false;
              this.loadBanks();
              
              // this.resetForm();
            },
            error: (error) => {
              this.loader = false;
              console.error('Update failed', error);
              // this.resetForm();
             
              // Handle error if necessary
            },
          });
      }
  }
  private loadBanks() {
    // this.loader=true;
    this.bank.getBankListdata().subscribe(
      (data) => {
        this.banksList = data;
        console.log(data);
        this.loader = false;
        // this.dataSource.shift();
      },
      (error) => {
        console.error('Error fetching banks', error);
        this.loader = false;
      }
    );

    // this.banksList = this.bank.banksList;
    console.log(this.banksList);
  }

  onBankSelected(bankId: number) {
    // If needed, you can retrieve the selected bank's full details
    const selectedBank = this.banksList.find((bank) => bank.id === bankId);
    console.log('Selected Bank:', selectedBank);
  }

  onCancel(): void {
    this.dialogRef.close(); // Close the dialog without any changes
  }

  resetForm() {
    this.formGroup.reset(); // Reset form values
    this.formGroup.markAsPristine(); // Mark form as pristine
    this.formGroup.markAsUntouched(); // Mark form as untouched
    Object.values(this.formGroup.controls).forEach((control) => {
      control.setErrors(null); // Reset validation errors for each control
    });
    this.bankIdControl.setValue('');
    this.filteredBanks = of(this.banksList);
    this.filteredBanks = this.formGroup.controls['bankId'].valueChanges.pipe(
      map((value) => this._filterBanks(value || ''))
    );
    this.loadBanks();
  }

  private _filterBanks(value: string): any[] {
    console.log(value, 'in filter');
    const filterValue = value.toLowerCase();
    return this.banksList.filter((bank) =>
      bank.bankName.toLowerCase().includes(filterValue)
    );
  }

  openRejectDialog() {
    const dialogRef = this.dialog.open(RejectconfirmationComponent, {
      data: { id: this.user.id, type: this.type },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.dialogRef.close();
      if (result) {
        console.log('Rejection Reason:', result);
      }
    });
  }
  formatWithdrawMessage(message: string | undefined): string {
    return message ? message.replace(/\n/g, '<br>') : 'No message available';
  }
  
 
  getDepositApproveStatus() {
    this.apprvservice.getDepositObjById(this.user.id).subscribe(
      (data) => {

        this.obj = data
        
        this.status = data.approveStatus;
        console.log('Status:', this.status);
      },
      (error) => {
        console.error('Error fetching banks', error);
      }
    );
    
  }

  onSendMessage() {
    const updatedData = this.formGroup.value;
    if (this.formGroup.valid) {
      this.loader = true;
      this.apprvservice.sendWithdrawMsg1(this.user.id, updatedData).subscribe(
        (data) => {
          console.log(data);
          this.loader = false;
          this.snackbarService.snackbar(
            'send message successfully!',
            'success'
          );
          this.dialogRef.close();
        },
        (error) => {
          console.error('Error fetching banks', error);
          this.loader = false;
        }
      );
    }
  }

  openImageDialog(imageUrl: string) {
    this.dialog.open(ImageDialogComponent, {
      data: { imageUrl },
      panelClass: 'custom-dialog-container',
      width: '80%', // You can adjust the width and height
      height: '80%',
    });
  }
  // scrollableImage: HTMLElement | null = null;

  // enableScroll(event: MouseEvent) {
  //   this.scrollableImage = event.target as HTMLElement;
  //   this.scrollableImage.style.overflow = 'hidden'; // Ensure overflow is hidden
  //   this.scrollableImage.addEventListener('wheel', this.onScroll);
  // }

  // disableScroll() {
  //   if (this.scrollableImage) {
  //     this.scrollableImage.removeEventListener('wheel', this.onScroll);
  //     this.scrollableImage = null;
  //   }
  // }

  // onScroll = (event: WheelEvent) => {
  //   if (this.scrollableImage) {
  //     event.preventDefault(); // Prevent page scroll
  //     const scrollAmount = event.deltaY; // Detect scroll direction
  //     this.scrollableImage.style.transform += `translateY(${scrollAmount}px)`; // Move image up/down
  //   }
  // };

  isZoomed = false;
  scrollableImage: HTMLElement | null = null;

  // zoomImage(event: MouseEvent) {
  //   const imgElement = event.target as HTMLElement;
  //   imgElement.classList.add('zoomed');
  //   this.isZoomed = true;
  //   this.scrollableImage = imgElement;
  //   this.scrollableImage.style.cursor = 'grab';
  //   this.scrollableImage.addEventListener('wheel', this.onScroll);
  // }

  resetImage(event: MouseEvent) {
    const imgElement = event.target as HTMLElement;
    imgElement.classList.remove('zoomed');
    this.isZoomed = false;
    if (this.scrollableImage) {
      this.scrollableImage.removeEventListener('wheel', this.onScroll);
      this.scrollableImage = null;
    }
  }

  onScroll = (event: WheelEvent) => {
    if (this.isZoomed && this.scrollableImage) {
      event.preventDefault(); // Prevent default scroll behavior
      const scrollAmount = event.deltaY > 0 ? 10 : -10; // Scroll up or down based on wheel
      const currentTransform =
        this.scrollableImage.style.transform ||
        'translate(0px, 0px) scale(1.5)';
      const match = currentTransform.match(
        /translate\(([-\d.]+)px, ([-\d.]+)px\)/
      );

      let translateX = 0,
        translateY = 0;
      if (match) {
        translateX = parseFloat(match[1]);
        translateY = parseFloat(match[2]);
      }

      translateY += scrollAmount;
      this.scrollableImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.5)`;
    }
  };

  @ViewChild('zoomedImage', { static: false }) zoomedImage!: ElementRef;
  @ViewChild('magnifier', { static: false }) magnifier!: ElementRef;

  zoomImage(event: MouseEvent) {
    const imageContainer = event.target as HTMLElement;
    const zoomedImage = this.zoomedImage.nativeElement;
    const magnifier = this.magnifier.nativeElement;

    const rect = imageContainer.getBoundingClientRect();
    const x = event.clientX - rect.left; // Get X coordinate relative to image
    const y = event.clientY - rect.top; // Get Y coordinate relative to image

    // Show zoomed image and magnifier
    zoomedImage.style.visibility = 'visible';
    magnifier.style.visibility = 'visible';

    // Move the magnifier with the mouse
    const magnifierSize = 100; // Adjust this for magnifier size
    magnifier.style.left = `${x - magnifierSize / 2}px`;
    magnifier.style.top = `${y - magnifierSize / 2}px`;

    // Calculate the corresponding position on the zoomed image
    const zoomFactor = 1.5; // Adjust zoom factor (same as CSS width/height)
    const zoomX =
      (x / rect.width) * zoomedImage.width - zoomedImage.width / zoomFactor / 2;
    const zoomY =
      (y / rect.height) * zoomedImage.height -
      zoomedImage.height / zoomFactor / 2;

    // Move the zoomed image to correspond with the magnifier
    zoomedImage.style.transform = `translate(${-zoomX}px, ${-zoomY}px) scale(${zoomFactor})`;
  }

  hideZoom() {
    const zoomedImage = this.zoomedImage.nativeElement;
    const magnifier = this.magnifier.nativeElement;

    // Hide zoomed image and magnifier
    zoomedImage.style.visibility = 'hidden';
    magnifier.style.visibility = 'hidden';
  }
  onInput(event: any) {
      const inputElement: HTMLInputElement = event.target;
      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.onUTRInput(inputElement.value);
      }, this.doneTypingInterval);
    }
    get utrNumber() {
      return this.formGroup.get('utrNumber');
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
  
    openUTRDetailsPopup(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.width = '60%';
        // dialogConfig.data = this.operations;
        dialogConfig.data = { utrNumber: this.formGroup.get('utrNumber')?.value };
    
        console.log('in dialog');
        const dialogRef = this.dialog.open(UTRDetailsPopupComponent, dialogConfig);
      }

      retry(Id: number ,obj : any){

        this.loader = true;
        this.obj.userId=this.formGroup.get('userId')?.value;
        this.obj.utrNumber=this.formGroup.get('utrNumber')?.value;
        this.obj.amount=this.formGroup.get('amount')?.value;
        this.retried=true;
        this.apprvserv.retry(Id,this.retried,obj).subscribe(
          (data) => {
           
           
            this.loader = false;
            this.snackbarService.snackbar('Successful !!', 'success');
          },
          (error) => {
            this.loader = false;
            console.log(error);
          }
        );
      }
}
