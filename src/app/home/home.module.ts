import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout/layout.component';
import { HomeRoutingModule } from './home-routing.module';
import { LandingpageComponent } from './landingpage/landingpage.component';
import { NavbarComponent } from './navbar/navbar.component';
import { DepositeComponent } from './deposite/deposite.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AddNewUserComponent } from './add-new-user/add-new-user.component';
import { MatSelectModule } from '@angular/material/select'; // Import MatSelectModule for using the select component
import { MatButtonModule } from '@angular/material/button'; // Import MatButtonModule for using buttons
import { MatFormFieldModule } from '@angular/material/form-field'; // Import MatFormFieldModule for using form fields
import { MatInputModule } from '@angular/material/input'; // Import MatInputModule for using input fields
import { MatIconModule } from '@angular/material/icon'; // Import MatIconModule for using icons
import { SharedModule } from '../shared/shared.module';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { UsersComponent } from './users/users.component';
import { DWModalComponent } from './dw-modal/dw-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ProfileComponent } from './profile/profile.component';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { UpdatePasswordComponent } from './update-password/update-password.component';
import { MatGridListModule } from '@angular/material/grid-list';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
} from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReportsComponent } from './reports/reports.component';
import { UpdatePassDiallogComponent } from './update-pass-diallog/update-pass-diallog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppvDepositComponent } from './appv-deposit/appv-deposit.component';
import { AppvDListComponent } from './appv-dlist/appv-dlist.component';
import { AddSiteComponent } from './add-site/add-site.component';
import { MatTabsModule } from '@angular/material/tabs';
import { SiteMasterComponent } from './site-master/site-master.component';
import { SiteUserComponent } from './site-user/site-user.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BankComponent } from './bank/bank.component';
import { AddOldUserComponent } from './add-old-user/add-old-user.component';
import { TelUsersComponent } from './tel-users/tel-users.component';
import { BankingPanelComponent } from './banking-panel/banking-panel.component';
import { AppvWlistComponent } from './appv-wlist/appv-wlist.component';
import { SupAdepositComponent } from './sup-adeposit/sup-adeposit.component';
import { SupDtableComponent } from './sup-dtable/sup-dtable.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { SupAWithdrawComponent } from './sup-awithdraw/sup-awithdraw.component';
import { AppvHomeComponent } from './appv-home/appv-home.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UserPanelComponent } from './user-panel/user-panel.component';
import { ImageTextModalComponent } from './image-text-modal/image-text-modal.component';
import { ApproveComponent } from './approve/approve.component';
import { ApvadminDailog1Component } from './apvadmin-dailog1/apvadmin-dailog1.component';
import { NotificationComponent } from './notification/notification.component';
import { UtcToLocalPipe } from '../services/utc-to-local.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LineBreaksPipe } from '../services/line-breaks.pipe';
import { WattiChatComponent } from './watti-chat/watti-chat.component';
import { WattiService } from '../services/watti.service';
import { MatListModule } from '@angular/material/list';
import { DepositeChatComponent } from './deposite-chat/deposite-chat.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { WatiAccountsComponent } from './wati-accounts/wati-accounts.component';
import { OperationsPanelComponent } from './operations-panel/operations-panel.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
@NgModule({
  declarations: [
    LayoutComponent,
    LandingpageComponent,
    NavbarComponent,
    DepositeComponent,
    WithdrawComponent,
    UsersComponent,
    DWModalComponent,
    ProfileComponent,
    AddNewUserComponent,
    UpdatePasswordComponent,
    ReportsComponent,
    UpdatePassDiallogComponent,
    AppvDepositComponent,
    AppvDListComponent,
    AddSiteComponent,
    SiteMasterComponent,
    SiteUserComponent,
    BankComponent,
    AddOldUserComponent,
    TelUsersComponent,
    BankingPanelComponent,
    AppvWlistComponent,
    SupAdepositComponent,
    SupDtableComponent,
    SupAWithdrawComponent,
    AppvDListComponent,
    AppvHomeComponent,
    UserPanelComponent,
    ImageTextModalComponent,
    ApproveComponent,
    ApvadminDailog1Component,
    NotificationComponent,
    UtcToLocalPipe,
    LineBreaksPipe,
    WattiChatComponent,
    DepositeChatComponent,
    WatiAccountsComponent,
    OperationsPanelComponent,
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
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
    MatTooltipModule,
    MatTabsModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    MatInputModule,
    MatDatepickerModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatGridListModule,
    MatCheckboxModule,
    MatMenuModule,
    MatChipsModule
  ],
  providers: [WattiService]
})
export class HomeModule {}
