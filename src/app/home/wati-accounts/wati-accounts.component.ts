import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ComponettitleService } from '../../services/componenttitle.service';
import { WatiAccountService, WatiAccount } from '../../services/wati-account.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-wati-accounts',
  templateUrl: './wati-accounts.component.html',
  styleUrls: ['./wati-accounts.component.scss']
})
export class WatiAccountsComponent implements OnInit {
  accounts: WatiAccount[] = [];
  formGroup: FormGroup;
  displayedColumns: string[] = ['id', 'watiName', 'teamId', 'isActive', 'webhookUrl', 'actions'];
  isEditing = false;
  selectedAccount: WatiAccount | null = null;
  loader = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private titleService: ComponettitleService,
    private watiAccountService: WatiAccountService
  ) {
    this.titleService.changeTitle('Wati Accounts');
    this.initForm();
  }

  private initForm(): void {
    this.formGroup = this.fb.group({
      watiName: ['', [Validators.required]],
      apiToken: ['', [Validators.required]],
      teamId: ['', [Validators.required]],
      serviceId: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loader = true;
    this.watiAccountService.getAllAccounts()
      .pipe(
        finalize(() => {
          this.loader = false;
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Loaded accounts:', data);
          data.forEach(account => {
            console.log(`Account ${account.watiName} status:`, account.isActive);
          });
          this.accounts = data;
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
          this.snackBar.open('Error loading accounts. Please try again.', 'Close', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  onSubmit(): void {
    if (this.formGroup.valid && !this.submitting) {
      this.submitting = true;
      const accountData = this.formGroup.value;

      const request$ = this.isEditing && this.selectedAccount
        ? this.watiAccountService.updateAccount(this.selectedAccount.id, accountData)
        : this.watiAccountService.createAccount(accountData);

      request$
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe({
          next: (response) => {
            const message = this.isEditing ? 'Account updated successfully' : 'Account created successfully';
            this.snackBar.open(message, 'Close', { 
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.resetForm();
            this.loadAccounts();
          },
          error: (error) => {
            console.error('Error saving account:', error);
            const message = this.isEditing ? 'Error updating account' : 'Error creating account';
            this.snackBar.open(message + '. Please try again.', 'Close', { 
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  editAccount(account: WatiAccount): void {
    this.isEditing = true;
    this.selectedAccount = account;
    this.formGroup.patchValue({
      watiName: account.watiName,
      apiToken: account.apiToken,
      teamId: account.teamId,
      serviceId: account.serviceId,
      isActive: account.isActive
    });
  }

  deleteAccount(id: number): void {
    if (confirm('Are you sure you want to delete this account?')) {
      this.loader = true;
      this.watiAccountService.deleteAccount(id)
        .pipe(
          finalize(() => {
            this.loader = false;
          })
        )
        .subscribe({
          next: () => {
            this.snackBar.open('Account deleted successfully', 'Close', { 
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.loadAccounts();
          },
          error: (error) => {
            console.error('Error deleting account:', error);
            this.snackBar.open('Error deleting account. Please try again.', 'Close', { 
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }

  toggleAccountStatus(account: WatiAccount): void {
    if (this.loader) return;
    
    this.loader = true;
    const action = account.isActive ? 'deactivateAccount' : 'activateAccount';
    
    this.watiAccountService[action](account.id)
      .pipe(
        finalize(() => {
          this.loader = false;
        })
      )
      .subscribe({
        next: () => {
          const message = `Account ${account.isActive ? 'deactivated' : 'activated'} successfully`;
          this.snackBar.open(message, 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadAccounts();
        },
        error: (error) => {
          console.error('Error toggling account status:', error);
          const message = `Error ${account.isActive ? 'deactivating' : 'activating'} account`;
          this.snackBar.open(message + '. Please try again.', 'Close', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  resetForm(): void {
    this.formGroup.reset({ isActive: true });
    this.isEditing = false;
    this.selectedAccount = null;
  }

  copyWebhookUrl(url: string): void {
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Webhook URL copied to clipboard', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    });
  }
} 