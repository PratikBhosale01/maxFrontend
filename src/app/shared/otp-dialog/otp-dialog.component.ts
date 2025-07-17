import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppUserService } from '../../services/app-user.service';
import { timer, switchMap } from 'rxjs';

@Component({
  selector: 'app-otp-dialog',
  templateUrl: './otp-dialog.component.html',
  styleUrls: ['./otp-dialog.component.scss']
})
export class OtpDialogComponent implements OnInit {
  otp: string | null = null;
  loading = true;
  error: string | null = null;

  constructor(public dialogRef: MatDialogRef<OtpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { username: string },
    private appUserService: AppUserService
  ) {

  }

ngOnInit(): void {
  this.loading = true;

  if (!this.data?.username) {
  console.error('Username is undefined');
  this.error = 'Username is missing.';
  this.loading = false;
  return;
}

timer(500)
  .pipe(
    switchMap(() => {
      const observable = this.appUserService.getOtpByUsername(this.data.username);
      if (!observable) {
        throw new Error('getOtpByUsername returned undefined');
      }
      return observable;
    })
  )
  .subscribe({
    next: (response) => {
      this.otp = response;
      this.loading = false;
    },
    error: (err) => {
      console.error(err);
      this.error = 'Failed to fetch OTP.';
      this.loading = false;
    }
  });
}

  close(): void {
    this.dialogRef.close();
  }
} 