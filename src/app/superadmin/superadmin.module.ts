import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LayoutComponent } from './layout/layout.component';
import { SuperadminRoutingModule } from './superadmin-routing.module';
import { NavbarComponent } from './navbar/navbar.component';
import { DepositeComponent } from './deposite/deposite.component';
import { LandingpageComponent } from './landingpage/landingpage.component';
import { AddNewUserComponent } from './add-new-user/add-new-user.component';
import { DWModalComponent } from './dw-modal/dw-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { SharedModule } from '../shared/shared.module';
import { ProfileComponent } from './profile/profile.component';
import { UpdatePasswordComponent } from './update-password/update-password.component';
import { UsersComponent } from './users/users.component';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UsertableModalComponent } from './usertable-modal/usertable-modal.component';
import { DialogTableComponent } from './dialog-table/dialog-table.component';
import { CustomMatPaginatorIntl } from '../shared/custom/CustomMatPaginatorIntl';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { BankingComponent } from './banking/banking.component';
import { ReportsComponent } from './reports/reports.component';


@NgModule({
  declarations: [
    LayoutComponent,
    NavbarComponent,
    LandingpageComponent,
    AddNewUserComponent,
    DepositeComponent,
    DWModalComponent,
    ProfileComponent,
    UpdatePasswordComponent,
    UsersComponent,
    WithdrawComponent,
    UsertableModalComponent,
    DialogTableComponent,
    BankingComponent,
    ReportsComponent
  ],
  imports: [
    CommonModule,
    SuperadminRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    SharedModule,
    MatDialogModule,
    MatCardModule,
    MatGridListModule,
    MatSortModule,
    MatTableModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatPaginator,
    MatSort,
    MatPaginatorModule,
    MatDatepickerModule,
    FormsModule,
    MatNativeDateModule,
    MatFormFieldModule,


   
  

  ],
  providers: [DatePipe,
    { provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }
  ],
  
})
export class SuperadminModule {}
