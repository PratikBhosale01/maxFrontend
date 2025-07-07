import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { ApproveService } from '../../services/approve.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-rejectconfirmation',

  templateUrl: './rejectconfirmation.component.html',
  styleUrl: './rejectconfirmation.component.scss'
})
export class RejectconfirmationComponent {
  customReason: string = '';  // Stores the reason entered by the user or selected from chips
  predefinedReasons: string[] = ['same slip', 'payment not received'];
  selectedReasons: string[] = [];  // Keeps track of the selected reasons
  Id:number;
  loader: boolean;
  userId: number;
  user: any;
  type: string;
  role: string;
  
  constructor(
    public dialogRef: MatDialogRef<RejectconfirmationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apprvserv: ApproveService,
    private snackbarService: SnackbarService,
  ) {
    this.Id = data.id;
    this.type = data.type; 
    this.role = data.role;
    // console.log('Received ID:', data.id); 
  }

  // Updates the custom reason input when a chip is clicked
  selectReason(reason: string) {
 
    this.customReason = reason; 
 
    const index = this.selectedReasons.indexOf(reason);
    if (index >= 0) {
      this.selectedReasons.splice(index, 1);  // Deselect reason if it's already selected
    } else {
      this.selectedReasons.push(reason);  // Select reason if it's not selected
    }
  }

  onConfirm(): void {

    const rejectionData = {
      customReason: this.customReason, 
      selectedReasons: this.selectedReasons,  
    };
    let reasonsAsString;
   if(this.customReason!=null) {
    reasonsAsString=this.customReason;
   }else{ reasonsAsString = this.selectedReasons.join(', ');}
        
    const userData = localStorage.getItem('user');
 

    if (userData) {
      this.user = JSON.parse(userData);
      this.userId = this.user.user_id;  // Get the user ID from localStorage
    } else  {
      // Handle the case when user data is not available
      console.error('User data not found in localStorage');
      return;
    }

    if(this.role==="BANKER"){
      this.apprvserv.RejectApproveAdmin(this.Id,reasonsAsString,this.userId).subscribe(
        (data) => {
          this.snackbarService.snackbar('Successfull', 'success');
          this.loader = false;
          this.dialogRef.close(rejectionData);
        }
      )
    }else{
      // console.log(this.type);
      if(this.type==="Deposit"){
      this.loader = true;

    this.apprvserv.Reject(this.Id,reasonsAsString,this.userId).subscribe(
      (data) => {
        this.snackbarService.snackbar('Successfull', 'success');
        console.log('reject', data);
     
        this.loader = false;
        this.dialogRef.close(rejectionData);
      },
      (error) => {
        this.loader = false;
        console.log(error);
      }
    );} else if(this.type==="wati"){
      this.apprvserv.RejectApprove(this.Id,reasonsAsString,this.userId).subscribe(
        (data) => {
          this.snackbarService.snackbar('Successfull', 'success');
          console.log('reject', data);
       
          this.loader = false;
          this.dialogRef.close(rejectionData);
        },
        (error) => {
          this.loader = false;
          console.log(error);
        }
      );

    } else {
      this.loader = true;
      this.apprvserv.RejectWithdraw(this.Id,reasonsAsString,this.userId).subscribe(
        (data) => {
          this.snackbarService.snackbar('Successfull', 'success');
          console.log('reject', data);
       
          this.loader = false;
          this.dialogRef.close(rejectionData);
        },
        (error) => {
          this.loader = false;
          console.log(error);
        }
      );

      }
    }


   
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
