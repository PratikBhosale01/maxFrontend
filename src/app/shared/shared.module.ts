import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './loader/loader.component';
import { DialogComponent } from './dialog/dialog.component';
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
import { AddBankingDialogComponent } from './add-banking-dialog/add-banking-dialog.component';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DailogTABComponent } from './dailog-tab/dailog-tab.component';
import { HttpClientModule}from '@angular/common/http';
import { UpdateBankComponent } from './update-bank/update-bank.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { UTRDetailsPopupComponent } from './utrdetails-popup/utrdetails-popup.component';
import { SlipComponent } from './slip/slip.component';
import { TableComponent } from './table/table.component';
import { UpdateSiteComponent } from './update-site/update-site.component';
import { BankAccountTableComponent } from './bank-account-table/bank-account-table.component';
import { AddUserDialogComponent } from './add-user-dialog/add-user-dialog.component';
import { RejectconfirmationComponent } from './rejectconfirmation/rejectconfirmation.component';
import { MatChipsModule} from '@angular/material/chips';
import { EditDialogComponent } from './edit-dialog/edit-dialog.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CheckAppvDailogComponent } from './check-appv-dailog/check-appv-dailog.component';
import { BotbankingupdateComponent } from './botbankingupdate/botbankingupdate.component';
import { AddslotdailogComponent } from './addslotdailog/addslotdailog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AmountRangeDailogComponent } from './amount-range-dailog/amount-range-dailog.component';

import { MatNativeDateModule } from '@angular/material/core';
import { AttachedslotrangeComponent } from './attachedslotrange/attachedslotrange.component';
import { CheckbankAccountComponent } from './checkbank-account/checkbank-account.component';
import { ClietUserListComponent } from './cliet-user-list/cliet-user-list.component';
import { SendmsgdailogComponent } from './sendmsgdailog/sendmsgdailog.component';
import { AddAppUserComponent } from './add-app-user/add-app-user.component';
import { CreateUserDailogComponent } from './create-user-dailog/create-user-dailog.component';
import { UpAppvlistComponent } from './up-appvlist/up-appvlist.component';
import { WithdrawConfirmComponent } from './withdraw-confirm/withdraw-confirm.component';
import { DepoDailogComponent } from './depo-dailog/depo-dailog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WithDailogComponent } from './with-dailog/with-dailog.component';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { OtpDialogComponent } from './otp-dialog/otp-dialog.component';
import { NotificationDropdownComponent } from './notification-dropdown/notification-dropdown.component';
import { BankStatementDialogComponent } from './bank-statement-dialog/bank-statement-dialog.component';
import { VoucherDialogComponent } from './voucher-dialog/voucher-dialog.component';
import { UtcToLocalPipe } from '../services/utc-to-local.pipe';

@NgModule({
  declarations: [
    LoaderComponent,
    DialogComponent,
    AddBankingDialogComponent,
    DailogTABComponent,
    UpdateBankComponent,
    ConfirmationDialogComponent,
    UTRDetailsPopupComponent,
    SlipComponent,
    TableComponent,
    UpdateSiteComponent,
    BankAccountTableComponent,
    AddUserDialogComponent,
    RejectconfirmationComponent,
    EditDialogComponent,
    CheckAppvDailogComponent,
    BotbankingupdateComponent,
    AddslotdailogComponent,
    AmountRangeDailogComponent,
    AttachedslotrangeComponent,
    CheckbankAccountComponent,
    ClietUserListComponent,
    SendmsgdailogComponent,
    AddAppUserComponent,
    CreateUserDailogComponent,
    UpAppvlistComponent,
    WithdrawConfirmComponent,
    DialogComponent,
    DepoDailogComponent,
    WithDailogComponent,
    OtpDialogComponent,
    NotificationDropdownComponent
  ,
    //  UtcToLocalPipe,
  BankStatementDialogComponent
  ,
  VoucherDialogComponent
   
  ],
  imports: [
    CommonModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatGridListModule,
    MatSortModule,
    MatTableModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatChipsModule,
    ReactiveFormsModule,
    FormsModule,
    MatChipsModule,  
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatCheckboxModule,

  ],
  exports:[
    LoaderComponent,
    DialogComponent,
    NotificationDropdownComponent,
  BankStatementDialogComponent,
  VoucherDialogComponent,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatGridListModule,
    MatSortModule,
    MatTableModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    HttpClientModule,
    MatChipsModule,
    FormsModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatCheckboxModule
  ]
})
export class SharedModule { }
