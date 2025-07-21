import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenCheckService {
  private tokenRotateInterval = 20000;
  private rotateSubscription: Subscription;

  constructor(private authService: AuthService) {}

  startTokenRotation(): void {
    this.stopTokenRotation(); // Ensure no duplicate intervals
    this.rotateSubscription = interval(this.tokenRotateInterval).subscribe(() => {
      const token = localStorage.getItem('token');
      if (token) {
        this.authService.refreshToken().subscribe(
          (response) => {
            if (response && response.token) {
              localStorage.setItem('token', response.token);
            }
          },
          (error) => {
            console.error('Error during token rotation:', error);
            // Optionally logout or handle error
          }
        );
      }
    });
  }

  stopTokenRotation(): void {
    if (this.rotateSubscription) {
      this.rotateSubscription.unsubscribe();
    }
  }
}
