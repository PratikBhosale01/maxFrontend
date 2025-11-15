import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ApproveService } from '../../services/approve.service';
import { BankingService } from '../../services/banking.service';
import { Bank } from '../../domain/Bank';
import { AppvDeposit } from '../../domain/Deposite';
import { RejectconfirmationComponent } from '../../shared/rejectconfirmation/rejectconfirmation.component';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SnackbarService } from '../../services/snackbar.service';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { CheckAppvDailogComponent } from '../../shared/check-appv-dailog/check-appv-dailog.component';
import { UtrService } from '../../services/utr.service';
import { UTRDetailsPopupComponent } from '../../shared/utrdetails-popup/utrdetails-popup.component';
import { interval, Subscription } from 'rxjs';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { ComponettitleService } from '../../services/componenttitle.service';
import { DepoDailogComponent } from '../../shared/depo-dailog/depo-dailog.component';
import { WithDailogComponent } from '../../shared/with-dailog/with-dailog.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-approve',
  templateUrl: './approve.component.html',
  styleUrl: './approve.component.scss'
})
export class ApproveComponent implements OnInit, OnDestroy {

  deposits: any[] = [];
  depositForms: { [key: number]: FormGroup } = {};
  selectedStatuses = new FormControl('');
  userRole: string;
  statuses: string[] = [
    'ALL',
    'USER_CREATED',
    'PENDING',
    'APPROVED',
    'IN_PROCESS',
    'DONE',
    'FAILED',
    'DELETED',
  ];
  bankerStatus: string[] = [  'ALL',
    'USER_CREATED',
    'PENDING',
    'APPROVED',
    'IN_PROCESS',
    'DONE',
    'FAILED',
    'DELETED','REJECTED', 'ADMIN_REJECT'];
  isTyping = false; // Flag to track typing
  doneTypingInterval = 500;
  currentPage = 0;
  typingTimer: any;
  itemsPerPage = 2;
  totalItems; // Update this based on your total items in the API
  formGroup: FormGroup;
  formGroups: { [key: string]: FormGroup } = {};
  loader: boolean;
  userId: any;
  isApproved: { [key: string]: any } = {};
  private zoomedStates = new Map<number, boolean>();
  loader2: any;
  retried: boolean;
  subscription: any;
  zoomedState: { [key: number]: boolean } = {};
  panning = false;
  startX = 0;
  startY = 0;
  translateX = 0;
  translateY = 0;
  bankNotifications: any[] = [];
  isLoading = false;
  private notificationSubscription: Subscription;
  selectedDevice: string = '';
  deviceList: string[] = [];
  private draggedNotification: any = null;
  ur: any;
  // Map depositId -> available banks for that deposit (from getAvailableBanksByTimeSorted)
  availableBanksByDeposit: { [key: number]: Bank[] } = {};
  // Map depositId -> selected bank object
  selectedBankByDeposit: { [key: number]: Bank | null } = {};

  constructor(private ApproveService: ApproveService,
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    public dialog: MatDialog,
    private utrservice: UtrService,
    private cdr: ChangeDetectorRef,
    private titleService: ComponettitleService,
    private notificationService: NotificationService,
    private bankingService: BankingService
  ) {
    this.titleService.changeTitle('Approve Panel');
    this.loadProducts();
    this.subscription = interval(2000).subscribe(() => {
      if (!this.isTyping) {
        this.loadProducts();
      }
    });

  }

  // Called when user focuses any bank select - pause auto-refresh while interacting
  onSelectFocus() {
    this.isTyping = true;
    // clear typing timer to avoid immediate unpause
    clearTimeout(this.typingTimer);
  }

  // Called on blur - resume auto-refresh shortly after user leaves
  onSelectBlur() {
    // small delay to avoid race if user quickly re-opens
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.isTyping = false;
    }, this.doneTypingInterval);
  }
  @ViewChild('zoomedImage', { static: false }) zoomedImage!: ElementRef;
  @ViewChild('magnifier', { static: false }) magnifier!: ElementRef;
  @ViewChild('amountInput') amountInput: ElementRef;
  @ViewChild('approveButton') approveButton: ElementRef;

  ngOnInit(): void {
    this.getUserRole();
    this.selectedStatuses.valueChanges.subscribe((selectedStatuses) => {
      this.onStatusChange(selectedStatuses);
    });

    this.getUserId();
    // console.log(this.deposits);
    this.loadBankNotifications();
    this.loadDeviceList();
    
    this.notificationSubscription = interval(2000).subscribe(() => {
      this.loadBankNotifications();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  initializeFormGroups() {
    this.deposits.forEach(deposit => {
      // Create a FormGroup for each deposit if it doesn't exist
      if (!this.formGroups[deposit.id]) {
        this.formGroups[deposit.id] = new FormGroup({
          utrNumber: new FormControl(deposit.utrNumber || ''),
          amount: new FormControl(deposit.amount || ''),
          newId: new FormControl(''),
          deviceName: new FormControl('')
        });
      }
    });
  }

  // Get the FormGroup for a specific deposit
  getFormGroup(depositId: string): FormGroup {
    // This should never return undefined if initializeFormGroups() works correctly
    const formGroup = this.formGroups[depositId];
    if (!formGroup) {
      console.error(`FormGroup for deposit ID ${depositId} is missing!`);
      // Fallback (optional, but ideally shouldn't be needed)
      this.formGroups[depositId] = new FormGroup({
        utrNumber: new FormControl(''),
        amount: new FormControl('', [Validators.required]),
        newId: new FormControl('')
      });
    }
    return this.formGroups[depositId];
  }
  onStatusChange(newStatuses): void {
    this.currentPage = 0; // Reset to the first page whenever the filter changes
    // Reset paginator to first page
    this.loadProducts();
  }

  retry(Id: number, obj: any) {
    this.loader = true;
    this.retried = true;
    this.ApproveService.retry(Id, this.retried, obj).subscribe(
      (data) => {
        console.log('Approve', data);
        this.loadProducts();
        this.loader = false;
        this.snackbarService.snackbar('Successful !!', 'success');
      },
      (error) => {
        this.loader = false;
        console.log(error);
      }
    );
  }


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

  get utrNumber() {
    return this.formGroup.get('utrNumber');
  }

  toggleZoom(depositId: number): void {
    const currentState = this.zoomedStates.get(depositId) || false;
    this.zoomedStates.set(depositId, !currentState);
  }

  onInput(event: any) {
    const inputElement: HTMLInputElement = event.target;
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.onUTRInput(inputElement.value);
    }, this.doneTypingInterval);
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


  isZoomed(depositId: number): boolean {
    return this.zoomedStates.get(depositId) || false;
  }

  loadProducts(): void {
    const statusesToSend = this.selectedStatuses.value.length > 0 
      ? this.selectedStatuses.value 
      : this.getDefaultStatuses();
  
    const serviceCall = this.userRole === 'BANKER'
      ? this.ApproveService.getRejectedSelectiondata(statusesToSend, this.itemsPerPage, this.currentPage)
      : this.ApproveService.getSelectiondata(statusesToSend, this.itemsPerPage, this.currentPage);
  
    serviceCall.subscribe(data => {
      this.deposits = data.content;
      this.totalItems = data.totalElements;
      this.initializeFormGroups();

      // For each deposit, request available banks for its entry time
      this.deposits.forEach(deposit => {
        this.loadAvailableBanks(deposit);
      });

      this.cdr.detectChanges();
    });
  }
  
  private getDefaultStatuses(): string[] {
    return this.userRole === 'BANKER'
      ? ['PENDING', 'REJECTED', 'IN_PROCESS', 'FAILED', 'APPROVED']
      : ['PENDING', 'IN_PROCESS', 'FAILED', 'APPROVED'];
  }

  /**
   * Fetch available banks for a given deposit using its entry time.
   * Stores results in availableBanksByDeposit[deposit.id].
   */
  private loadAvailableBanks(deposit: any): void {
    try {
      const timeStr = this.getTimeStringFromTimestamp(deposit.entryTime);
      // Call banking service to get banks available at this time
      this.bankingService.getAvailableBanksByTimeSorted(timeStr).subscribe({
        next: (banks: Bank[]) => {
          this.availableBanksByDeposit[deposit.id] = banks || [];
          // If deposit already has a bank-like field, try to set default selected bank
          if (deposit.bankId || deposit.bankName) {
            const match = banks?.find(b => b.id === deposit.bankId || b.bankId === deposit.bankId || b.bankName === deposit.bankName || b.displayName === deposit.bankName);
            if (match) {
              this.selectedBankByDeposit[deposit.id] = match;
            }
          }
        },
        error: (err) => {
          console.error('Error loading available banks for deposit', deposit.id, err);
          this.availableBanksByDeposit[deposit.id] = [];
        }
      });
    } catch (err) {
      console.error('Error in loadAvailableBanks', err);
      this.availableBanksByDeposit[deposit.id] = [];
    }
  }

  /**
   * Convert timestamp to a time string expected by banking API (HH:mm).
   */
  private getTimeStringFromTimestamp(ts: any): string {
    try {
      const d = new Date(ts);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    } catch (err) {
      console.warn('Invalid timestamp for getTimeStringFromTimestamp', ts);
      return '';
    }
  }

  onBankSelect(bank: Bank, depositId: number) {
    this.selectedBankByDeposit[depositId] = bank;
  }

  /**
   * Handler for native select change that receives bank id (string) from the template.
   * Finds the Bank object in availableBanksByDeposit and stores it in selectedBankByDeposit.
   */
  onBankSelectById(bankId: any, depositId: number) {
    if (!bankId) {
      this.selectedBankByDeposit[depositId] = null;
      return;
    }
    const banks = this.availableBanksByDeposit[depositId] || [];
    const found = banks.find(b => (b.id != null && b.id == bankId) || (b.bankId != null && b.bankId == bankId));
    if (found) {
      this.selectedBankByDeposit[depositId] = found;
    } else {
      // If not found by id, just clear selection
      this.selectedBankByDeposit[depositId] = null;
    }
  }

  onRejectToggle(event: any): void {
 
    this.userRole = event.checked ? 'BANKER' : 'APPROVEWITHDRAW';
      this.refresh();
  
  }

  nextPage(): void {
    if ((this.currentPage + 1) * this.itemsPerPage < this.totalItems) {
      this.currentPage++;
      this.loadProducts();
    }
  }
  getDepositFormGroup(deposit: any): FormGroup {
    if (!this.depositForms[deposit.id]) {
      this.depositForms[deposit.id] = this.fb.group({
        utrNumber: [deposit.utrNumber || ''],
        amount: [deposit.amount || '']
      });
    }
    return this.depositForms[deposit.id];
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadProducts();
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

  getUserId() {
    let userData = localStorage.getItem('user');
    if (!userData) {
      userData = sessionStorage.getItem('user');
    }
    if (userData) {
      const zuser = JSON.parse(userData);
      this.userId = zuser.user_id; // Get the user ID from storage
    } else {
      // Handle the case when user data is not available
      console.error('User data not found in localStorage or sessionStorage');
      return;
    }
  }
  refresh() {

    this.loadProducts();
    this.loadBankNotifications();
    // this.resetAllFormGroups();  
  }


  onSave(deposite: any): void {
    this.isApproved[deposite.id] = true;
    const formGroup = this.getFormGroup(deposite.id);
    formGroup.patchValue({ newId: deposite.isNewId });

    if (formGroup) {
      const formValue = formGroup.value;
      if (deposite.notificationId) {
        formValue.notificationId = deposite.notificationId;
      }

      this.loader = true;
      // attach selected bank info (if user selected one)
      const selectedBank = this.selectedBankByDeposit[deposite.id];
      if (selectedBank) {
        formValue.bankId = (selectedBank as any).id ?? (selectedBank as any).bankId;
      }

      this.ApproveService
        .Approvecheck(deposite.id, 0, this.userId, formValue)
        .subscribe({
          next: (response) => {
  
            this.snackbarService.snackbar('Update successfully!', 'success');
            this.loadProducts();
            this.loader = false;
            this.resetFormGroup(deposite.id);
          },
          error: (error) => {
            this.loadProducts();
            this.loader = false;
            this.resetFormGroup(deposite.id);
            alert(error.message || 'Something went wrong!');
          },
        });
    }
  }
  resetFormGroup(depositId: string) {
    const formGroup = this.getFormGroup(depositId);
    if (formGroup) {
      formGroup.reset({
        utrNumber: '',
        amount: '',
        newId: ''
      });

    } else {
      console.error(`No FormGroup found for deposit ID ${depositId}`);
    }
  }



  openRejectDialog(deposit: any): void {
    const dialogRef = this.dialog.open(RejectconfirmationComponent, {
      data: { id: deposit.id, type: 'wati',
        role:this.userRole  
       },
    });

    dialogRef.afterClosed().subscribe((result) => {

    });
  }

  onUtrEnter(event: KeyboardEvent) {

    if (event.key === 'Enter') {

      event.preventDefault(); // Prevent form submission
      this.amountInput.nativeElement.focus(); // Move focus to amount input
    }
  }
  onFocus() {
    this.isTyping = true;
    clearTimeout(this.typingTimer);// Move focus to amount input
  }


  onAmountEnter(event: KeyboardEvent, deposit: any) {
    this.isTyping = true;
    clearTimeout(this.typingTimer);
    if (event.key === 'Enter') {
      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.isTyping = false;
      }, this.doneTypingInterval);
      if (!this.isApproved[deposit.id]) {
        this.onSave(deposit);
      }
    }

  }


  // Method to detect when typing stops
  onKeyUp() {
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.isTyping = false;
    }, this.doneTypingInterval);
  }

  deleteReport(Id: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: null,
    });
    dialogRef.afterClosed().subscribe((isConfirmed) => {
      if (isConfirmed) {
        this.loader = true;
        this.ApproveService.deleteReport(Id, this.userId).subscribe({
          next: (response) => {
            console.log('Delete successful', response);
            this.loadProducts();
            this.snackbarService.snackbar('Deleted successful', 'success');
            this.loader = false;

            // Handle success logic, e.g., showing a notification or refreshing the list
          },
          error: (error) => {
            console.error('Delete failed', error);
            this.loader = false;
            // Handle error logic, e.g., showing an error message
          }
        })
      }
    });
  }

  startPanning(event: MouseEvent, depositID: any) {
    if (!this.isZoomed(depositID)) return; // Panning sirf zoom hone par
    this.panning = true;
    this.startX = event.clientX - this.translateX;
    this.startY = event.clientY - this.translateY;
    event.preventDefault(); // Default behavior rokne ke liye
  }

  panImage(event: MouseEvent) {
    if (!this.panning) return;
    this.translateX = event.clientX - this.startX;
    this.translateY = event.clientY - this.startY;
  }

  stopPanning() {
    this.panning = false;
  }

  getTransform(id: number): string {
    if (this.isZoomed(id)) {
      return `scale(2) translate(${this.translateX}px, ${this.translateY}px)`;
    }
    return 'scale(1)';
  }

  depositeDialog() {
    const dialogRef = this.dialog.open(DepoDailogComponent, {
      width: '800px',
      data: null,
    }
    );
  }

  withdarwDialog() {
    const dialogRef = this.dialog.open(WithDailogComponent, {
      width: '800px',
      data: null,
    }
    );
  }

  copyToClipboard(link: string): void {
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        // Optional: Show a success message
        alert('Link copied to clipboard!');
        // Or use a toast/notification service if available, e.g.:
        // this.toastr.success('Link copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy link: ', err);
        // Optional: Show an error message
        alert('Failed to copy link.');
      });
    } else {
      alert('No link available to copy.');
    }
  }

  getUserRole() {
    let userData = localStorage.getItem('user');
    if (!userData) {
      userData = sessionStorage.getItem('user');
    }
    if (userData) {
      const user = JSON.parse(userData);
      this.ur = user.role_user;
      this.userRole = user.role_user;
    } else {
      console.error('User data not found in localStorage or sessionStorage');
    }
  }

  loadBankNotifications() {
    this.isLoading = true;
    if (this.selectedDevice) {
      this.notificationService.getBankNotificationsByDevice(this.selectedDevice).subscribe({
        next: (notifications) => {
          this.bankNotifications = notifications;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading bank notifications:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.notificationService.getBankNotifications().subscribe({
        next: (notifications) => {
          this.bankNotifications = notifications;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading bank notifications:', error);
          this.isLoading = false;
        }
      });
    }
  }

  closeNotification(id: number) {
    this.notificationService.closeNotification(id).subscribe({
      next: (response) => {
        console.log('Notification closed successfully', response);
        this.loadBankNotifications();
      },
      error: (error) => {
   console.log(error);
  }
  });  }

  loadDeviceList() {
    // Get unique device names from notifications
    this.notificationService.getBankNotifications().subscribe({
      next: (notifications) => {
        this.deviceList = [...new Set(notifications.map(n => n.deviceName))];
      },
      error: (error) => {
        console.error('Error loading device list:', error);
      }
    });
  }

  onDeviceChange(deviceName: string) {
    this.selectedDevice = deviceName;
    this.loadBankNotifications();
  }

  onDragStart(event: DragEvent, notification: any) {
    this.draggedNotification = notification;
    event.dataTransfer.setData('text/plain', JSON.stringify(notification));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private roundUpToNearest10(amount: number): number {
    const truncated = Math.trunc(amount);          
    return Math.ceil(truncated / 10) * 10;  
  }

  onDrop(event: DragEvent, deposit: any) {

    event.preventDefault();
    if (!this.draggedNotification) return;

    // Extract amount from notification text/title
    const amount = this.extractAmount(this.draggedNotification);
    if (amount) {
      // Get the form group for this deposit
      const formGroup = this.getFormGroup(deposit.id);
      // Round up the amount to nearest 10
      const roundedAmount = this.roundUpToNearest10(amount);
      // Patch the amount value
      formGroup.patchValue({ amount: roundedAmount });
        // Set deviceName from draggedNotification and try to auto-select matching bank
        if (this.draggedNotification?.deviceName) {
          formGroup.get('deviceName')?.setValue(this.draggedNotification.deviceName);

          // Attempt to auto-select a bank whose deviceName/displayName/bankMessage/upiId matches the notification's deviceName
          const banks: Bank[] = this.availableBanksByDeposit[deposit.id] || [];
          const notifDevice = this.normalizeDeviceName(this.draggedNotification.deviceName);

          const found = banks.find(b => {
            const bb: any = b;
            const fields = [bb.deviceName, bb.displayName, bb.bankMessage, bb.upiId, bb.bankName];
            return fields.some(f => {
              if (!f) return false;
              const norm = this.normalizeDeviceName(f);
              return (norm && notifDevice && (norm.includes(notifDevice) || notifDevice.includes(norm)));
            });
          });

          if (found) {
            this.selectedBankByDeposit[deposit.id] = found;
          } else {
            // clear any previous selection if no match
            this.selectedBankByDeposit[deposit.id] = null;
          }
          // ensure UI updates
          this.cdr.detectChanges();
        }
        // Store notification ID for later use in onSave
        deposit.notificationId = this.draggedNotification.id;

      // Close the notification after successful drop
      this.closeNotification(this.draggedNotification.id);

      // Auto approve after amount is set
      // if (!this.isApproved[deposit.id]) {
      //   this.onSave(deposit);
      // }
    }

    this.draggedNotification = null;
  }

  /**
   * Normalize device/bank strings for matching: remove non-alphanumeric and lowercase
   */
  private normalizeDeviceName(s: string): string {
    if (!s) return '';
    try {
      return s.replace(/[{}\-\s_\|&@,.():]/g, '').toLowerCase();
    } catch (err) {
      return s.toString().toLowerCase();
    }
  }

  private extractAmount(notification: any): number | null {
    // Try to extract amount from title first
    const titleMatch = notification.title.match(/₹([\d,]+)/);
    if (titleMatch) {
      return parseInt(titleMatch[1].replace(/,/g, ''));
    }

    // Try to extract from text
    const textMatch = notification.text.match(/₹([\d,]+)/);
    if (textMatch) {
      return parseInt(textMatch[1].replace(/,/g, ''));
    }

    // Try to extract from text with "received" pattern
    const receivedMatch = notification.text.match(/Received\s+([\d,.]+)\s+Rupees/);
    if (receivedMatch) {
      return parseInt(receivedMatch[1].replace(/,/g, ''));
    }

    return null;
  }

}
