import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarService } from '../../services/snackbar.service';
import { ApproveService } from '../../services/approve.service';
@Component({
  selector: 'app-loginuser',
  templateUrl: './loginuser.component.html',
  styleUrls: ['./loginuser.component.scss'],
})
export class LoginUserComponent implements OnInit {
  loginForm: FormGroup;
  loader: boolean = false;
  loaderOtp: boolean = false; // Loader for OTP generation
  otpSent: boolean = false; // Track if OTP has been sent
  decodedToken: any;
  constructor(
    public auth: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
    private _snackBar: MatSnackBar,
    private snackbarService: SnackbarService,
    private appvService: ApproveService,
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(5)]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      otp: [''] // OTP field, required only after OTP is sent
    });
  }

  generateOtp() {
    if (this.loginForm.get('username')?.valid && this.loginForm.get('password')?.valid) {
      this.loaderOtp = true;
      // Call backend API to generate OTP
      this.auth.generateOtp(
        this.loginForm.value.username).subscribe(
        (response) => {
          this.loaderOtp = false;
          this.otpSent = true;
          this.snackbarService.snackbar('OTP sent successfully', 'success');
        },
        (error) => {
          this.loaderOtp = false;
          this.snackbarService.snackbar('Failed to send OTP', 'error');
        }
      );
    } else {
      this.snackbarService.snackbar('Please enter valid username and password', 'error');
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      if (this.otpSent && !this.loginForm.value.otp) {
        this.snackbarService.snackbar('Please enter OTP', 'error');
        return;
      }
      this.loader = true;
      // Send OTP along with username and password if otpSent
      const loginPayload = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password,
        ...(this.otpSent ? { otp: this.loginForm.value.otp } : {})
      };
      this.auth.loginUser(loginPayload).subscribe(
        (response) => {
          localStorage.setItem('token', response.token);
          this.snackbarService.snackbar('Login successful', 'success');
          this.loader = false;
          this.decryptJwtToken(response.token);
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          const userRole = userData.role_user || '';
          if(localStorage.getItem('token') != null){
          if (userRole != 'SUPERADMIN') {
            if (userRole === 'approvedeposit' || userRole === 'approvewithdraw') {
              this.fetchPendingTransactions(userRole);
            }
            this.router.navigate(['/home']);
          }
          if (userRole === 'SUPERADMIN') {
            this.router.navigate(['/SA']);
          } }
        },
        (error) => {
          this.snackbarService.snackbar('Login Failed', 'error');
          this.loader = false;
        }
      );
    } else {
      // Handle form validation errors if needed
    }
  }
  fetchPendingTransactions(userRole: any) {
    // Fetch pending transactions based on the user role
    // Example:
    // if (userRole === 'approvedeposit') {
    //   this.appvService.g.subscribe((deposits) => {
    //     this.pendingDeposits = deposits;
    //   });
    // } else if (userRole === 'approvewithdraw') {
    //   this.appvWithdrawService.fetchPendingWithdrawals().subscribe((withdrawals) => {
    //     this.pendingWithdrawals = withdrawals;
    //   });
    // }
    //...
  }
  
  decryptJwtToken(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(base64));
      this.decodedToken = decodedPayload;
      
      localStorage.setItem('user', JSON.stringify(this.decodedToken));
    } catch (error) {
      console.error('Error decoding JWT token:', error);
    }
  }
} 