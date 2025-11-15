import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { LandingpageComponent } from './landingpage/landingpage.component';
import { AddNewUserComponent } from './add-new-user/add-new-user.component';
import { DepositeComponent } from './deposite/deposite.component';
import { ProfileComponent } from './profile/profile.component';
import { UpdatePasswordComponent } from './update-password/update-password.component';
import { UsersComponent } from './users/users.component';
import { WithdrawComponent } from './withdraw/withdraw.component';
import { BankingComponent } from './banking/banking.component';
import { BankingPanelComponent } from '../home/banking-panel/banking-panel.component';
import { ReportsComponent } from './reports/reports.component';
import { UserPanelComponent } from '../home/user-panel/user-panel.component';
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
        path: 'add',
        component: AddNewUserComponent,
      },
      {
        path: 'deposit',
        component: DepositeComponent,
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'update',
        component: UpdatePasswordComponent,
      },
      {
        path: 'users',
        component: UserPanelComponent,
      },
      {
        path: 'withdraw',
        component: WithdrawComponent,
      },
      {
        path: 'Banking',
        component: BankingPanelComponent,
      },
      {
        path: 'reports',
        component: ReportsComponent,
      },
      // {
      //   path: 'add-site',
      //   component: AddSiteComponent,
      // },

    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuperadminRoutingModule {}
