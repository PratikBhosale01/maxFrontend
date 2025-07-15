import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { LandingpageComponent } from './landingpage/landingpage.component';
import { DepositeComponent } from './deposite/deposite.component';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { UsersComponent } from './users/users.component';
import { ProfileComponent } from './profile/profile.component';
import { AddNewUserComponent } from './add-new-user/add-new-user.component';
import { UpdatePasswordComponent } from './update-password/update-password.component';
import { ReportsComponent } from './reports/reports.component';
import { UpdatePassDiallogComponent } from './update-pass-diallog/update-pass-diallog.component';
import { AppvDepositComponent } from './appv-deposit/appv-deposit.component';
import { AppvDListComponent } from './appv-dlist/appv-dlist.component';
import { AddSiteComponent } from './add-site/add-site.component';
import { SiteMasterComponent } from './site-master/site-master.component';
import { SiteUserComponent } from './site-user/site-user.component';
import { BankComponent } from './bank/bank.component';
import { AddOldUserComponent } from './add-old-user/add-old-user.component';
import { TelUsersComponent } from './tel-users/tel-users.component';
import { BankingPanelComponent } from './banking-panel/banking-panel.component';
import { AppvWlistComponent } from './appv-wlist/appv-wlist.component';
import { SupAdepositComponent } from './sup-adeposit/sup-adeposit.component';
import { SupAWithdrawComponent } from './sup-awithdraw/sup-awithdraw.component';
import { AppvHomeComponent } from './appv-home/appv-home.component';
import { UserPanelComponent } from './user-panel/user-panel.component';
import { ApproveComponent } from './approve/approve.component';
import { NotificationComponent } from './notification/notification.component';
import { WattiChatComponent } from './watti-chat/watti-chat.component';
import { DepositeChatComponent } from './deposite-chat/deposite-chat.component';
import { WatiAccountsComponent } from './wati-accounts/wati-accounts.component';
import { OperationsPanelComponent } from './operations-panel/operations-panel.component';


// Components

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: LandingpageComponent,
      },
      {
        path: 'deposit',
        component: DepositeComponent,
      },
      {
        path: 'withdraw',
        component: WithdrawComponent,
      },
      {
        path: 'add',
        component: AddNewUserComponent,
      },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'update',
        component: UpdatePasswordComponent,
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'reports',
        component: ReportsComponent,
      },
      {
        path: 'Update-pass-dialog',
        component: UpdatePassDiallogComponent,
      },
      {
        path: 'AppvDeposit',
        component: AppvDepositComponent,
      },
      {
        path: 'AppvDList',
        component: AppvDListComponent,
      },
      {
        path: 'add-site',
        component: AddSiteComponent,
      },
      {
        path: 'site-master',
        component: SiteMasterComponent,
      },
      {
        path: 'site-user',
        component: SiteUserComponent,
      },
      {
        path: 'Bank',
        component: BankComponent,
      },
      {
        path: 'Add-Old',
        component: AddOldUserComponent,
      },
      {
        path: 'Tel-Users',
        component: TelUsersComponent,
      },
      {
        path: 'Banking Panel',
        component: BankingPanelComponent,
      },
      {
        path: 'AppvWlist',
        component: AppvWlistComponent,
      },
      {
        path: 'SupADeposit',
        component: SupAdepositComponent,
      },
      {
        path: 'SupAWithdraw',
        component: SupAWithdrawComponent,
      },
      {
        path:'appv-home',
        component: AppvHomeComponent,
      },
      {
        path:'user-panel',
        component: UserPanelComponent,
      },
      {
        path: 'approve',
        component: ApproveComponent,
      },
      {
        path: 'notification',
        component: NotificationComponent,
      },
      {
        path: "watti-chat",
        component: WattiChatComponent,
      },
      {
        path: "Deposite-Chat",
        component: DepositeChatComponent,
      }, {
        path: "wati-accounts",
        component: WatiAccountsComponent,
      },
      {
        path: 'operations-panel',
        component: OperationsPanelComponent,
      },
    
      

    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
