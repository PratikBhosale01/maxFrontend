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
  masters777Exch,
  mastersWood,
  mastersWorld,
} from '../../domain/SiteMaster';
import { UtrService } from '../../services/utr.service';
import { SuperAdminService } from '../../services/super-admin.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ComponettitleService } from '../../services/componenttitle.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-add-new-user',
  templateUrl: './add-new-user.component.html',
  styleUrl: './add-new-user.component.scss',
})
export class AddNewUserComponent {
  formGroup: FormGroup;
  // roles: string[] = ['USER','ADMIN','SUPERADMIN','APPROVEADMIN', 'DEPOSIT','APPROVEDEPOSIT'];
  roles: string[] = ['DEPOSITCHAT','WITHDRAWCHAT','ADMIN','SUPERADMIN','APPROVEADMIN','APPROVEDEPOSIT','APPROVEWITHDRAW','SUPPORT','BANKER'];
  chatOptions: string[] = []; // Array to hold unique chat IDs

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
    private notificationService: NotificationService
  ) {}

  @ViewChild('fileInput') fileInput: ElementRef;

 
  ngOnInit(): void {
    this.titleService.changeTitle('Add user panel');
    this.myFormValues();
    const currentDate = new Date();
    // this.formGroup.get('date').setValue(currentDate);
    this.loadUniqueWaIds();
   
  }

  openFileInput(): void {
    this.fileInput.nativeElement.click();
  }
  myFormValues(): void {
    this.formGroup = this.fb.group({
      role:['', Validators.required],
      username: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, this.passwordValidator]],
      // name: ['', Validators.required],
      // site_id: ['', Validators.required],
      id: ['0'],
      zuserId: [''],
      // date: [new Date()],
      waIds: [[]]
    });

    // Listen for changes on the role field
    this.formGroup.get('role').valueChanges.subscribe(role => {
      const chatIdControl = this.formGroup.get('waIds');
      
      if (role === 'SUPPORT') {
        // Make chatId required for SUPPORT role
        chatIdControl.setValidators([
          Validators.required,
          (control) => {
            const value = control.value;
            return Array.isArray(value) && value.length > 0 ? null : { required: true };
          }
        ]);
      } else {
        // Remove validators if not SUPPORT role
        chatIdControl.clearValidators();
        // Clear chatId value when role is not SUPPORT
        chatIdControl.setValue([]);
      }
      
      // Update validation status
      chatIdControl.updateValueAndValidity();
    });
  }

  // Load chat IDs from notification service
  loadUniqueWaIds() {
    this.loader = true;
    this.notificationService.getchatIds().subscribe({
      next: (waIds) => {
        this.chatOptions = waIds;
        console.log('Unique chat IDs:', this.chatOptions);
        this.loader = false;
      },
      error: (err) => {
        console.error('Error fetching unique chat IDs:', err);
        this.loader = false;
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
