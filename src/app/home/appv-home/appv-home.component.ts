import { Component } from '@angular/core';
import { SuperAdminLandingService } from '../../services/super-admin-landing.service';
import { SupADepositService } from '../../services/sup-adeposit.service';
import { SnackbarService } from '../../services/snackbar.service';
import { ComponettitleService } from '../../services/componenttitle.service';
import { interval } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { AppvWlistComponent } from '../appv-wlist/appv-wlist.component';
import { ApvadminDailog1Component } from '../apvadmin-dailog1/apvadmin-dailog1.component';

@Component({
  selector: 'app-appv-home',
  templateUrl: './appv-home.component.html',
  styleUrl: './appv-home.component.scss'
})
export class AppvHomeComponent {
  openAppvWithdraw() {
    const dialogRef = this.dialog.open(ApvadminDailog1Component, {
      width: '100%',
      panelClass: 'custom-dialog',
      data: {
        // Pass the user object or other data here if needed
      }
    });
  } 
openAppvDeposit() {
throw new Error('Method not implemented.');
}


  appvWithdraw:number;
  appvDeposit:number;
  totalDeposit:number;
  totalWithdraw:number;
  table1Data;
  table2Data;
  loader: any;
  displayedColumns: string[] = ['Sr.no','column1', 'column2', 'column3','column4'];
  subscription: any;
  

  constructor(private landingservice : SuperAdminLandingService,
              private supADeposit: SupADepositService,  
              private snackbarService: SnackbarService,    
              private titleService: ComponettitleService,
              public dialog: MatDialog,  
  ){
    this.titleService.changeTitle('Home panel');
    // this.dateRange = { start: null, end: null };
    this.getDepositeTabledata();
    this.getWithdrawTabledata();
    this.subscription = interval(10000).subscribe(() => {
      this.getDepositeTabledata();
      this.getWithdrawTabledata();
    });

    this.getDeposit();
    this.getWithdraW();
    this.getAppvDeposite();
    this.getAppvWithdraW();
  
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getDeposit() {
    this.loader = true;
    this.supADeposit.getDepositRequestCount().subscribe(
      (data) => {
        this.totalDeposit = data;
        this.loader = false;
      },
      (error) => {
        console.error(error);
        this.loader = false;
      }
    );




  }

  getAppvDeposite() {
   
    this.supADeposit.getDepositCount().subscribe(
      (data) => {
          this.appvDeposit = data;
        },
      (error) => {
        this.snackbarService.snackbar('failed!', 'error');
      }
    );
  }
  getAppvWithdraW() {
  
    this.supADeposit.getWithdraw().subscribe(
      (data) => {
      
    
        this.totalWithdraw = data;
       
      },
      (error) => {
        console.error(error);
        // Handle error
        
      }
    );
  }


  getWithdraW() {
  
    this.supADeposit.getAppvWithdraw().subscribe(
      (data) => {
      this.appvWithdraw = data; 
      },
      (error) => {
        console.error(error);
        // Handle error
        
      }
    );
  }

  getDepositeTabledata() {

    this.supADeposit.getRecentDepositdata().subscribe(
      (data) => {
      console.log(data);
      this.table1Data=data;
       
      },
      (error) => {
        this.snackbarService.snackbar('failed!', 'error');
      
      
      }
    );
  }

  getWithdrawTabledata() {

    this.supADeposit.getRecentWithdrawdata().subscribe(
      (data) => {
      console.log(data);
      this.table2Data=data;
    
        
      },
      (error) => {
        this.snackbarService.snackbar('failed!', 'error');
      
      
      }
    );
  }

  

  
  

  // Data for Table 2
 

}
