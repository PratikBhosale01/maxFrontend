import { Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { AddAppUserComponent } from '../../shared/add-app-user/add-app-user.component';
import { AppUserService } from '../../services/app-user.service';
import { UpAppvlistComponent } from '../../shared/up-appvlist/up-appvlist.component';
import { OtpDialogComponent } from '../../shared/otp-dialog/otp-dialog.component';

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
constructor(public dialog: MatDialog, private appuserserv :AppUserService) {}
ngOnInit(): void{
  this.getuserID()
  this.fetchUser();
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
  this.loader=true;
  this.appuserserv.getUserDetails(this.Operator).subscribe(
    data => {
      this.dataSource = data;
     
      this.loader=false;
      // this.dataSource.shift();
 

    },
    error => {
      console.error('Error fetching banks', error);
      this.loader=false;
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

}
