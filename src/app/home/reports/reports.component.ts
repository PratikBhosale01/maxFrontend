import { Component, OnInit } from '@angular/core';
import { Operation, Operations } from '../../domain/operation';
import { ReportService } from '../../services/report.service';
import { Subscription, debounceTime, fromEvent, interval } from 'rxjs';
import { ComponettitleService } from '../../services/componenttitle.service';



@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  loader:boolean = false;
  operations:Operation[] ;
  displayedColumns: string[] = ['serialNumber','userName','operation', 'status','amount',];
  private subscription: Subscription;
  dataSource: Operation[]= [];
  Operator: number;
  constructor( private report: ReportService,
    private titleService : ComponettitleService
    
   ){

  }

  ngOnInit(): void {
    this.titleService.changeTitle('Operation Report');
    this.getuserID();
    this.getDeposite();
   
   
    // this.subscription = interval(5000).subscribe(() => {
    //   this.getDeposite();
    // });
  }

  getDeposite() {
    this.loader=true;
    this.report.getAllReport(this.Operator).subscribe(
      (data) => {
        // this.dataSource = data;
        this.operations=data;
        this.loader=false;
      },
      (error) => {
        this.loader=false;
        console.error(error);
      }
    );
  }

  getuserID() {
    const userString = localStorage.getItem('user');
    if (userString) {
      // Step 2: Access user_role attribute
      const user = JSON.parse(userString);
      this.Operator = user.user_id;
    }
  }
  refreshData(){
    this.getDeposite();
  }
}
