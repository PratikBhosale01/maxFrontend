import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthModule } from './auth/auth.module';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { BackendhealthService } from './services/backendhealth.service';
import { MaintainceComponent } from "./maintaince/maintaince.component";
import { AppConfigService } from './services/app-config.service';
import { TokenCheckService } from './services/token-check-service.service';

@Component({
    selector: 'app-root',
    standalone: true,
    providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [RouterOutlet, AuthModule, MaintainceComponent]
})
export class AppComponent implements OnInit {
  title = 'adminpanel';
  statusMessage :boolean = true;
   constructor(private backendHealth :BackendhealthService,
            private configService : AppConfigService,
            private tokenCheckService: TokenCheckService
){}


  ngOnInit(): void {
    this.tokenCheckService.startTokenRotation();
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
      
          
        
          },(error)=>{
            console.log(error);
              this.statusMessage = false;
          });
        
      }
    );

    
  }
  ngOnDestroy(): void {
    this.tokenCheckService.stopTokenRotation();
  }

}
