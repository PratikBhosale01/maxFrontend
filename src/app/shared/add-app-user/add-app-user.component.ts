import { Component, ElementRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComponettitleService } from '../../services/componenttitle.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ModalService } from '../../services/modal.service';
import { OperationsService } from '../../services/operations.service';
import { SiteService } from '../../services/site.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UtrService } from '../../services/utr.service';
import { SuperAdminService } from '../../services/super-admin.service';
import { DepositeWithdraw } from '../../domain/Deposite';
import { SITE, sites } from '../../domain/Site';
import { SiteMaster } from '../../domain/SiteMaster';
import { WatiAccountService, WatiAccount } from '../../services/wati-account.service';

@Component({
  selector: 'app-add-app-user',
  templateUrl: './add-app-user.component.html',
  styleUrl: './add-app-user.component.scss'
})
export class AddAppUserComponent {
  formGroup: FormGroup;
  SuperadminRoles: string[] = ['DEPOSITCHAT','WITHDRAWCHAT','ADMIN','SUPERADMIN','APPROVEADMIN','APPROVEDEPOSIT','APPROVEWITHDRAW','SUPPORT','BANKER'];
  approveadminRoles: string[] = ['DEPOSITCHAT','WITHDRAWCHAT','APPROVEDEPOSIT','APPROVEWITHDRAW','SUPPORT'];
  adminRoles: string[] = ['DEPOSITCHAT','WITHDRAWCHAT','APPROVEADMIN', 'DEPOSIT','APPROVEDEPOSIT','APPROVEWITHDRAW','BANKER','SUPPORT'];
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
  Operator: any;
  loggedInRole :string;
  watiAccountsList: WatiAccount[] = [];

  constructor(
    private site: SiteService,
    private fb: FormBuilder,
    private operation: OperationsService,
    private _snackBar: MatSnackBar,
    private modalService: ModalService,
    private elementRef: ElementRef,
    private utrservice: UtrService,
    private superAdmin: SuperAdminService,
    private snackbarService: SnackbarService,
    private titleService: ComponettitleService,
    private watiAccountService: WatiAccountService // <-- Inject service
  ) {
    this.getuserID();
  
  }

  @ViewChild('fileInput') fileInput: ElementRef;

  get availableRoles(): string[] {
    if (this.loggedInRole === 'SUPERADMIN') {
      return this.SuperadminRoles;
    } else if (this.loggedInRole === 'APPROVEADMIN') {
      return this.approveadminRoles;
    } else if (this.loggedInRole === 'ADMIN') {
      return this.adminRoles;
    } else {
      return [];
    }
  }
 
  ngOnInit(): void {
    this.getuserID();
    this.titleService.changeTitle('Add user panel');
    this.myFormValues();
    this.fetchWatiAccounts();
    // Listen for role changes to reset watiAccounts if needed
    this.formGroup?.get('role')?.valueChanges?.subscribe(role => {
      if (role !== 'DEPOSITCHAT') {
        this.formGroup.get('watiAccounts')?.setValue([]);
      }
    });
    const currentDate = new Date();
    // this.formGroup.get('date').setValue(currentDate);
   
  }
  getuserID() {
    const userString = localStorage.getItem('user');
    if (userString) {
      // Step 2: Access user_role attribute
      const user = JSON.parse(userString);
      this.Operator = user.user_id;
   
      this.loggedInRole = user.role_user;
      
    }
  }
  openFileInput(): void {
    this.fileInput.nativeElement.click();
  }
  myFormValues(): void {
    this.formGroup = this.fb.group({
      role: [''],
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, this.passwordValidator]],
      // name: ['', Validators.required],
      // site_id: ['', Validators.required],
       id: ['0'],
      zuserId: [''],
      watiAccountIds: [[]], // <-- Add this line
      // date: [new Date()],
    });
  }

  fetchWatiAccounts(): void {
    this.watiAccountService.getAllAccounts().subscribe({
      next: (accounts) => {
        this.watiAccountsList = accounts.filter(acc => acc.isActive);
      },
      error: (err) => {
        this.snackbarService.snackbar('Failed to load Wati accounts', 'error');
      }
    });
  }


  onSubmit() {
    
    this.loader=true;
    const userData = localStorage.getItem('user');
     
    if (userData) {
      this.user = JSON.parse(userData);
    } else {
    }
    const id = this.user.user_id;


    if (this.formGroup.valid) {
   
      this.formGroup.patchValue({ zuserId: id });
   
      
      this.superAdmin.saveUser(this.formGroup.value).subscribe(
        (data) => {
          this.snackbarService.snackbar(`added user successfully with name ${this.formGroup.value.username} `, 'success');
          
         this.loader = false;
          this.resetForm();
        },
        (error) => {
          this.loader = false;
          
          
          confirm("User Already Registered");
        }
      );
    }
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

 

  
}
