import { Component } from '@angular/core';
import { ComponettitleService } from '../../services/componenttitle.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SiteService } from '../../services/site.service';
import { SnackbarService } from '../../services/snackbar.service';
import { SITE } from '../../domain/Site';
import { UpdateSiteComponent } from '../../shared/update-site/update-site.component';
import { siteMaster, SiteMaster } from '../../domain/SiteMaster';
import { SiteMastersService } from '../../services/site-masters.service';

@Component({
  selector: 'app-site-master',
  templateUrl: './site-master.component.html',
  styleUrl: './site-master.component.scss'
})
export class SiteMasterComponent {
  siteMasterForm: FormGroup;
  loader=false;
  siteMaters :siteMaster[] ;
  siteCount :number=0;
  sites:SITE[] ;
  siteMasterId: number;
  // sites: { id: number, name: string }[] = [
  //   { id: 1, name: 'Site 1' },
  //   { id: 2, name: 'Site 2' },
   
  // ];
  // siteMasters = [
  //   { id: 1, name: 'Site 1', username: 'user1', password: 'pass1', transactionCode: 'trans1', dtoZuserId: 101, siteId: 1 },
  //   { id: 2, name: 'Site 2', username: 'user2', password: 'pass2', transactionCode: 'trans2', dtoZuserId: 102, siteId: 2 }
   
  // ];

  constructor( private siteService: SiteService, private titleService : ComponettitleService,public dialog: MatDialog,private fb: FormBuilder, private siteMasterService: SiteMastersService , private snackbarService: SnackbarService) {}

  ngOnInit(): void {
    this.titleService.changeTitle('Site-Master');
    this.fetchSiteMasters();
    this.fetchSites();
 

    this.siteMasterForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      transactionCode: ['', Validators.required],
      dtoZuserId: ['null', [Validators.required, Validators.pattern('^[0-9]+$')]],
      siteId: ['', [Validators.required, Validators.pattern('^[0-9]+$')]]
    });
    this.patchDtoZuserId();
  }

  onSiteMasterChange(event): void {
    const selectedSiteMaster = event.value;
    if(selectedSiteMaster.id){
      this.siteMasterId=selectedSiteMaster.id;
    }
    this.siteMasterForm.patchValue({
      username: selectedSiteMaster.username,
      password: selectedSiteMaster.password,
      transactionCode: selectedSiteMaster.transactionCode,
      dtoZuserId: selectedSiteMaster.dtoZuserId,
      siteId: selectedSiteMaster.siteId
    });
  }


  patchDtoZuserId() {
    let userString = localStorage.getItem('user');
    if (!userString) {
      userString = sessionStorage.getItem('user');
    }
    if (userString) {
      // Step 2: Access user_role attribute
      const user = JSON.parse(userString);
      // console.log('in patchDtouserId', user.user_id);
      this.siteMasterForm.patchValue({
        dtoZuserId: user.user_id // Replace 1234 with the actual value you want to set
      });
    }
  }
  fetchSites(): void {
    this.loader=true;
    this.siteService.getAllSitedata().subscribe(
      data => {
        this.sites = data;
        this.loader=false;
      },
      error => {
        console.error('Error fetching banks', error);
        this.loader=false;
      }
    );
  }

  onSubmit(): void {
    this.loader =true;
    if (this.siteMasterForm.valid) {
      this.siteMasterService.addSiteMaster(this.siteMasterForm.value).subscribe(response => {
        this.snackbarService.snackbar(`added siteMaster successfully with name ${this.siteMasterForm.value.username} `, 'success');
        console.log('siteMaster added successfully', response);
        this.loader= false;
      }, error => {
        console.error('Error adding siteMaster', error);
        this.loader= false;
      });
    }
  }

  deleteSiteMaster(id) {
  
    const isConfirmed = confirm('Do you really want to SiteMaster?');

    if (isConfirmed) {
      this.loader=true;

      this.siteMasterService.deleteSiteMasters(id).subscribe(
        (data) => {
          this.snackbarService.snackbar('Success: SiteMaster deleted', 'success');
          this.loader=false;
        },
        (error) => {
          console.log(error);
          this.loader=false;
        }
      );
    } else {
      // If the user cancels the confirmation, do nothing
      console.log('Deletion canceled by the user.');
    }

  }


  fetchSiteMasters(): void {
    console.log('Fetching siteMasters');
    // this.loader=true;
    this.siteMasterService.getAllSitedata().subscribe(
      data => {
        
        this.siteMaters = data;
        this.loader=false;
      },
      error => {
        console.error('Error fetching banks', error);
        this.loader=false;
      }
    );
  }
  


//   openUpdateSiteDialog(site: SITE): void {
//     const dialogConfig = new MatDialogConfig();
//     dialogConfig.width = '50%';
   
//     dialogConfig.data = {
//       siteId  : site.id,
//       name: site.name, 
//       url: site.url,
//   };
    
//     const dialogRef = this.dialog.open(UpdateSiteComponent, dialogConfig);
//     dialogRef.afterClosed().subscribe((result) => {
     
//     });
  

// }

onUpdate(): void {
  this.loader =true;
  this.patchDtoZuserId();
  if (this.siteMasterForm.valid) {
    this.siteMasterService.updateSiteMaster(this.siteMasterForm.value,this.siteMasterId).subscribe(response => {
      this.snackbarService.snackbar(`updated siteMaster successfully with name ${this.siteMasterForm.value.username} `, 'success');
      console.log('Site updated successfully', response);
      this.loader= false;
    }, error => {
      console.error('Error updated siteMaster', error);
      this.loader= false;
    });
  }
}

}
