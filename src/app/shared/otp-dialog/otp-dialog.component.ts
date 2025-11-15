import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppUserService } from '../../services/app-user.service';
import { timer, switchMap, throwError } from 'rxjs';

@Component({
  selector: 'app-otp-dialog',
  templateUrl: './otp-dialog.component.html',
  styleUrls: ['./otp-dialog.component.scss']
})
export class OtpDialogComponent implements OnInit {
  otp: string | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<OtpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { username: string },
    private appUserService: AppUserService
  ) {}

  ngOnInit(): void {
    this.fetchOtp();
  }

  fetchOtp(): void {
    this.loading = true;
    this.error = null;
    this.otp = null;

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
          if (!observable || typeof observable.subscribe !== 'function') {
            return throwError(() => new Error('getOtpByUsername returned invalid Observable'));
          }
       
        return observable;
      })
    )
    .subscribe({
      next: (response) => {
        this.otp = response.otp;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to fetch OTP.';
        this.loading = false;
      }
    });
}

  retry(): void {
    this.fetchOtp();
  }

  close(): void {
    this.dialogRef.close();
  }
}
