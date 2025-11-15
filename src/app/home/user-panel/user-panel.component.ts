import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { AddAppUserComponent } from '../../shared/add-app-user/add-app-user.component';
import { AppUserService } from '../../services/app-user.service';
import { UpAppvlistComponent } from '../../shared/up-appvlist/up-appvlist.component';
import { OtpDialogComponent } from '../../shared/otp-dialog/otp-dialog.component';
import { SnackbarService } from '../../services/snackbar.service';
import { WatiAccountService, WatiAccount } from '../../services/wati-account.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.scss']
})
export class UserPanelComponent {
ActiveUser: Number =0;
BlockUser: Number=0;
// displayedColumns = ['position', 'userId', 'count','operation' ];
dataSource : any[];
depositTableArray:any[];
  loader: boolean;
  Operator: any;
  operatorName:string;
  
  refreshInterval: any;
  activityData: any[] = [];
  selectedUserForActivity: string = '';
  showActivityModal: boolean = false;
  // WATI dialog state
  showWatiDialog: boolean = false;
  watiLoading: boolean = false;
  watiAllAccounts: WatiAccount[] = [];
  watiSelectedIds: number[] = [];
  watiTargetUser: any = null;
  // Withdraw dialog state
  showWithdrawDialog: boolean = false;
  withdrawDialogUser: any = null;
constructor(public dialog: MatDialog, private appuserserv :AppUserService,  private snackBar: SnackbarService, private watiService: WatiAccountService,) {}
ngOnInit(): void {
  this.getuserID();
  this.fetchUser(); // first time: full table
  this.refreshInterval = setInterval(() => this.fetchUser(), 5000); // next: only status update
  this.fetchActiveUserCount();
}

openDialogdetail(userId:number): void {
  const dialogConfig = new MatDialogConfig();
  dialogConfig.width = '80%';
  // dialogConfig.data = this.operations;
  dialogConfig.data = {
   initialData: 'Deposit',
  };

  
  const dialogRef = this.dialog.open(UpAppvlistComponent, dialogConfig);
  dialogRef.afterClosed().subscribe((result) => {
   
  });

}
openDialog() {
  const dialogConfig = new MatDialogConfig();
  dialogConfig.width = '40%';
  // dialogConfig.data = this.operations;
  dialogConfig.data = {
   initialData: 'Deposit',
  };

  
  const dialogRef = this.dialog.open(AddAppUserComponent, dialogConfig);
  dialogRef.afterClosed().subscribe((result) => {
   
  });
}

openOtpDialog(username: string): void {
  this.dialog.open(OtpDialogComponent, {
    width: '350px',
    data: { username }
  });
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
    this.operatorName =user.user_email;
  }
}

fetchActiveUserCount() {
  this.appuserserv.getActiveUserCount(this.Operator).subscribe(
    (response) => {
    this.ActiveUser=response;
      // Example response: { activeUsers: 50 }
    },
    (error) => {
      console.error('Error fetching user count:', error);
    }
  );
}

fetchBlockUserCount() {
  this.appuserserv.getBlockUserCount(this.Operator).subscribe(
    (response) => {
    this.ActiveUser=response;
      // Example response: { activeUsers: 50 }
    },
    (error) => {
      console.error('Error fetching user count:', error);
    }
  );
}




filterData(searchTerm: string) {
      
  this.dataSource= this.depositTableArray.filter(item =>
     item.userId.toLowerCase().includes(searchTerm.toLowerCase())
   );
 }

 fetchUser(): void {
  this.loader = true;
  this.appuserserv.getUserDetails(this.Operator).subscribe(
    data => {
      if (!this.dataSource) {
        // First time: assign full data
        this.dataSource = data;
      } else {
        // After first time: update only status
        // 1. Map bana lo username to logged
        const statusMap = new Map<string, boolean>();
        data.forEach(user => statusMap.set(user.username, user.logged));
        // 2. Recursively update status in existing dataSource
        const updateStatus = (users: any[]) => {
          if (!users) return;
          users.forEach(user => {
            if (statusMap.has(user.username)) {
              user.logged = statusMap.get(user.username);
            }
            if (user.children && user.children.length > 0) {
              updateStatus(user.children);
            }
          });
        };
        updateStatus(this.dataSource);
      }
      this.loader = false;
    },
    error => {
      console.error('Error fetching banks', error);
      this.loader = false;
    }
  );
}
blockUser(userId: number): void {
 
  this.loader=true;
  this.appuserserv.blockUser(userId).subscribe(
    data => {
      this.BlockUser = data;
      this.fetchUser();
      this.loader=false;
    },
    error => {
      console.error('Error fetching banks', error);
      this.loader=false;
    }
  );

}

logoutUser(userId: any): void {
  const confirmed = window.confirm(`Are you sure you want to logout user "${userId}"?`);
  if (confirmed) {
    this.loader = true;
    this.appuserserv.logoutUser(this.operatorName,userId).subscribe(
      data => {
        // Optionally show a message or update UI
        this.fetchUser();
        this.loader = false;
        this.snackBar.snackbar('User logged out successfully!', 'success'); 
      },
      error => {
        console.error('Error logging out user', error);
        this.loader = false;
      }
    );
  }
}

/**
 * Fetch and show activity for a user (by userId)
 */
showUserActivity(user: any): void {
  this.selectedUserForActivity = user.username;
  this.appuserserv.getUserActivity(user.userId || user.id).subscribe(
    (data) => {
      this.activityData = data;
      this.showActivityModal = true;
    },
    (error) => {
      this.activityData = [];
      this.showActivityModal = true;
    }
  );
}

closeActivityModal(): void {
  this.showActivityModal = false;
  this.activityData = [];
  this.selectedUserForActivity = '';
}

// WATI accounts dialog handlers
openWatiAccountsDialog(user: any): void {
  this.watiTargetUser = user;
  this.showWatiDialog = true;
  this.watiLoading = true;
  this.watiService.getAllAccounts().subscribe({
    next: (all) => {
      this.watiAllAccounts = all.filter(a => a.isActive);
      this.watiService.getAccountsByZuser(user.zuserId || user.id).subscribe({
        next: (mapped) => {
          this.watiSelectedIds = (mapped || []).map(m => m.id).filter(id => id != null);
          this.watiLoading = false;
        },
        error: () => {
          this.watiSelectedIds = [];
          this.watiLoading = false;
        }
      });
    },
    error: () => {
      this.watiAllAccounts = [];
      this.watiLoading = false;
    }
  });
}

closeWatiDialog(): void {
  this.showWatiDialog = false;
  this.watiAllAccounts = [];
  this.watiSelectedIds = [];
  this.watiTargetUser = null;
}

  // Withdraw dialog handlers
  openWithdrawDialog(user: any): void {
    this.withdrawDialogUser = user;
    this.showWithdrawDialog = true;
  }

  closeWithdrawDialog(): void {
    this.showWithdrawDialog = false;
    this.withdrawDialogUser = null;
  }

toggleWatiSelection(id: number): void {
  const idx = this.watiSelectedIds.indexOf(id);
  if (idx >= 0) {
    this.watiSelectedIds.splice(idx, 1);
  } else {
    this.watiSelectedIds.push(id);
  }
}

submitWatiSelection(): void {
  if (!this.watiTargetUser) return;
  const zuserId = this.watiTargetUser.zuserId || this.watiTargetUser.id;
  this.watiLoading = true;
  this.watiService.updateZuserWatiAccounts(zuserId, this.watiSelectedIds).subscribe({
    next: () => {
      this.snackBar.snackbar('WATI accounts updated', 'success');
      this.watiLoading = false;
      this.closeWatiDialog();
    },
    error: () => {
      this.snackBar.snackbar('Failed to update WATI accounts', 'error');
      this.watiLoading = false;
    }
  });
}

  formatLocalTime(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
    /**
     * Delete a user by username (calls backend by id)
     */
    deleteUser(id:any ,username: any ): void {
      const confirmed = window.confirm(`Are you sure you want to delete user "${username}"? `);
      if (confirmed) {
        this.loader = true;
        this.appuserserv.deleteUser(id).subscribe({
          next: () => {
            this.snackBar.snackbar('User deleted successfully!', 'success');
            this.fetchUser();
            this.loader = false;
          },
          error: (err) => {
            this.snackBar.snackbar('Failed to delete user', 'error');
            this.loader = false;
            console.error('Delete user error:', err);
          }
        });
      }
    }
}