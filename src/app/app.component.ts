import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthModule } from './auth/auth.module';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { BackendhealthService } from './services/backendhealth.service';
import { MaintainceComponent } from './maintaince/maintaince.component';
import { AppConfigService } from './services/app-config.service';
import { TokenCheckService } from './services/token-check-service.service';
import { SseServiceService } from './services/sse-service.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [RouterOutlet, AuthModule, MaintainceComponent],
})
export class AppComponent implements OnInit {
  title = 'adminpanel';
  data: any;

  statusMessage: boolean = true;
  constructor(
    private backendHealth: BackendhealthService,
    private configService: AppConfigService,
    private tokenCheckService: TokenCheckService,
    private sseService: SseServiceService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // this.sseService
    //   .getServerSentEvent(
    //     'http://localhost:8080/approveOperation/sse/subscribe'
    //   )
    //   .subscribe({
    //     next: (message) => {
    //       console.log('Received:', message);
    //       this.showNotification(message);
    //     },
    //     error: (err) => console.error('Error:', err),
    //   });

    //==============================================
    // this.tokenCheckService.startTokenCheck();
    // console.log(" in oninit");
    // this.statusMessage = "true";
    this.backendHealth.checkHealth().subscribe(
      (response) => {
        // console.log(" in response 2");
        this.statusMessage = response;
        // console.log(response);
      },
      (error) => {
        this.backendHealth.checkHealthSec().subscribe(
          (response) => {
            //need to false
          },
          (error) => {
            console.log(error);
            this.statusMessage = false;
          }
        );
      }
    );
  }
  // ngOnDestroy(): void {
  //   this.tokenCheckService.stopTokenCheck();
  // }
  // fetchData() {
  //   this.http
  //     .get('https://0djs0mh1-8080.inc1.devtunnels.ms/api/data')
  //     .subscribe((response) => (this.data = response));
  // }

  // showNotification(message: string) {
  //   if (!('Notification' in window)) {
  //     console.error('This browser does not support desktop notifications.');
  //     return;
  //   }
  
  //   // Request permission if not already granted
  //   if (Notification.permission === 'granted') {
  //     new Notification('New Message Received', {
  //       body: message,
  //       icon: 'assets/notification-icon.png', // Optional: Add an icon
  //     });
  //   } else if (Notification.permission !== 'denied') {
  //     Notification.requestPermission().then((permission) => {
  //       if (permission === 'granted') {
  //         new Notification('New Message Received', {
  //           body: message,
  //           icon: 'assets/notification-icon.png',
  //         });
  //       }
  //     });
  //   }
  // }
}
