import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarService } from '../../services/snackbar.service';
import { ApproveService } from '../../services/approve.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loader: boolean = false;
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
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loader = true;
      this.auth.loginUser(this.loginForm.value).subscribe(
        (response) => {
          // Try to set token in localStorage
          try {
            localStorage.setItem('token', response.token);
          } catch (e) {
            this.snackbarService.snackbar('Unable to store token', 'error');
            this.loader = false;
            return;
          }
  
          // Double-check if successfully stored 
          const token = localStorage.getItem('token');
          if (!token) {
            this.snackbarService.snackbar('Token not stored. Login failed.', 'error');
            this.loader = false;
            return;
          }
  
          this.snackbarService.snackbar('Login successful', 'success');
          this.loader = false;
          
          // Token is definitely set, now process ahead
          this.decryptJwtToken(response.token);
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          const userRole = userData.role_user || '';
  
          if (userRole !== 'SUPERADMIN') {
            if (userRole === 'approvedeposit' || userRole === 'approvewithdraw') {
              this.fetchPendingTransactions(userRole);
            }
            this.router.navigate(['/home']);
          } else if (userRole === 'SUPERADMIN') {
            this.router.navigate(['/SA']);
          }
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
