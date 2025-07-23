import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { AddAppUserComponent } from '../../shared/add-app-user/add-app-user.component';
import { AppUserService } from '../../services/app-user.service';
import { UpAppvlistComponent } from '../../shared/up-appvlist/up-appvlist.component';
import { OtpDialogComponent } from '../../shared/otp-dialog/otp-dialog.component';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-user-panel',
  templateUrl: './user-panel.component.html',
  styleUrl: './user-panel.component.scss'
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
constructor(public dialog: MatDialog, private appuserserv :AppUserService,  private snackBar: SnackbarService,) {}
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

}
