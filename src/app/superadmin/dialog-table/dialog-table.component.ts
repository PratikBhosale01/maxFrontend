import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Page, lastWeekDeposit } from '../../domain/lastWeek';
import { LastweekdataService } from '../../services/lastweekdata.service';
import { DatePipe, formatDate } from '@angular/common';
import { FormControl, FormGroup } from '@angular/forms';
import { DepositSuperadminService } from '../../services/deposit-superadmin.service';
import { SearchsuperadminService } from '../../services/searchsuperadmin.service';
import{ExcelService} from'../../services/excel.service';


@Component({
  selector: 'app-dialog-table',
  templateUrl: './dialog-table.component.html',
  styleUrl: './dialog-table.component.scss'
})
export class DialogTableComponent  implements OnInit  {
  searchText;
  loader: boolean = false;
  deposits: lastWeekDeposit[] = [];
  totalElements: number = 0;
  page: number = 0;
  size: number = 5;
  cumulativeCount: number = 0; // Track cumulative count across pages
  displayedColumns = ['position', 'userId', 'utrNumber','amount','date','status','siteName','BotUserName' ];
  dataSource:string;
  dateRange: { start: Date, end: Date };
  dataSourceType :string;
  StartDate;
  EndDate;
  searchTerm:string;
  inputPage: number;
  excelData;

  constructor(
    private searchService: SearchsuperadminService,
    private depositService: DepositSuperadminService,
    private lastweekdata :LastweekdataService,
    private datePipe: DatePipe,
    private excelService:ExcelService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.dateRange = { start: null, end: null };
    this.dataSource = data.operation;
    this.dataSourceType= data.type;
  }
  @ViewChild(MatPaginator) paginator: MatPaginator;


  ngOnInit(): void {
  
    this.getdata();
    // this.getRangedata();
    this.inputPage = 1;
  }

  getdata(): void {
    if(this.dataSource ==="Deposit"){
      this.dataSwitch();
    }else{
     this.displayedColumns = ['position', 'userId', 'amount','date','status','siteName','BotUserName' ];
      this.dataSwitch();
      
    }

  }

  dataSwitch(){
    switch (this.dataSourceType) {
      case "Lastweek's":
        this.get7daysRangedata();
        break;
      case "Total":
        this.getRangedata();
        this.gettotaldata();
        break;
      case "Today's":
        this.getTodaysRangedata();
        break;
      default:
        console.log("Invalid dataSourceType");
        break;
    }
  }



//==============*onPageChange

  onPageChange(event: any): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.inputPage = this.page + 1;

   if(this.searchTerm){
    this.onEnter(this.searchTerm);

   }else{

    if(this.dataSourceType==="Lastweek's"){
      this.get7daysRangedata();
      }else if(this.dataSourceType==="Total"){
        if (this.EndDate) {
          this.getRangetotaldata();
      } else {
          this.gettotaldata();
      }
      }else if(this.dataSourceType==="Today's"){
        this.getTodaysRangedata();
      }
      console.log("outside");
    }
  }

  getSerialNumber(index: number): number {
    // Return the cumulative count plus the index within the current page
    return this.cumulativeCount + index + 1;
  }

  getFormattedDate(timestamp: string): string {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      
    };
    return new Intl.DateTimeFormat(undefined, options).format(date);
}
updateSearchText(value: string) {
  this.searchText = value;
  console.log('Current search text:', this.searchText);
  // Additional logic can go here
}

  // getFormattedDate(timestamp: string): string {

  // //  console.log("1st" +timestamp);
  //   // Remove the extra "timestamp" at the end if it exists
  //   if (timestamp.endsWith("timestamp")) {
  //     timestamp = timestamp.slice(0, -9);
  //   }
  //   // console.log("2st" +timestamp);
  //   const date = new Date(timestamp);
  
  //   // console.log("1st" +date);
  //   // Format the date
  //   const formattedDate = this.datePipe.transform(date, 'd MMMM, y');
  //   // console.log("2st" +formattedDate);
  //   // Format the time in the local timezone
  //   const formattedTime = this.datePipe.transform(date, 'h:mm a');
  
  //   return `${formattedDate} at ${formattedTime}`;
  // }
  




range = new FormGroup({
  start: new FormControl<Date | null>(null),
  end: new FormControl<Date | null>(null),
});

//================================== get all data ================================
gettotaldata() {
  
  this.loader = true;

  let dataSubscription;
  if (this.dataSource === "Deposit") {
    dataSubscription = this.depositService.getAllDepositdata( this.size, this.page);
  } else if (this.dataSource === "Withdraw") {
    dataSubscription = this.depositService.getAllWithdrawdata( this.size, this.page);
  }

  if (dataSubscription) {
    dataSubscription.subscribe((data: any) => {
      console.log(data);
      this.deposits = data.content;
      console.log(this.deposits);
      this.totalElements = data.totalElements;
      this.cumulativeCount = (this.page * this.size);
      this.loader = false;
    }, (error) => {
      console.log(error);
      this.loader = false;
    });
  } else {
    this.loader = false;
    console.log("Invalid dataSourceType");
  }
}


getRangedata() {
  console.log("getRangedata");
  this.range.valueChanges.subscribe(values => {
     this.StartDate = values.start;
    this.EndDate = values.end;
    this.page = 0;
    // Reset the paginator
    if (this.paginator) {
      this.paginator.firstPage();
    }
    if(this.searchText){
      this.StartDate = formatDate(this.StartDate, 'yyyy-MM-dd', 'en-US');
      this.EndDate = formatDate(this.EndDate, 'yyyy-MM-dd', 'en-US');
      this.onEnter(this.searchText);

    }
     else if (this.StartDate && this.EndDate) {
      this.StartDate = formatDate(this.StartDate, 'yyyy-MM-dd', 'en-US');
      this.EndDate = formatDate(this.EndDate, 'yyyy-MM-dd', 'en-US');

      console.log(this.EndDate, this.StartDate);

      this.loader = true;

      let dataSubscription;
      if (this.dataSource === "Deposit") {
        dataSubscription = this.depositService.getDateDepositdata(this.StartDate, this.EndDate, this.size, this.page);
      } else if (this.dataSource === "Withdraw") {
        dataSubscription = this.depositService.getDateWithdrawdata(this.StartDate, this.EndDate, this.size, this.page);
      }
         
      if (dataSubscription) {
        dataSubscription.subscribe((data: any) => {
          console.log(data);
          this.deposits = data.content;
          // console.log(this.deposits);
          this.totalElements = data.totalElements;
          console.log(this.totalElements);
          this.cumulativeCount = (this.page * this.size);
          this.loader = false;
        }, (error) => {
          console.log(error);
          this.loader = false;
        });
      }
    }
  });
}

getRangetotaldata() {
  this.loader = true;
  if(this.searchText){
    this.onEnter(this.searchText);

  }
 
  let dataSubscription;
  if (this.dataSource === "Deposit") {
    dataSubscription = this.depositService.getDateDepositdata(this.StartDate, this.EndDate, this.size, this.page);
  } else if (this.dataSource === "Withdraw") {

    dataSubscription = this.depositService.getDateWithdrawdata(this.StartDate, this.EndDate, this.size, this.page);
  }

  if (dataSubscription) {
    dataSubscription.subscribe((data: any) => {
      console.log(data);
      this.deposits = data.content;
      console.log(this.deposits);
      this.totalElements = data.totalElements;
      this.cumulativeCount = (this.page * this.size);
      this.loader = false;
    }, (error) => {
      console.log(error);
      this.loader = false;
    });
  } else {
    this.loader = false;
    console.log("Invalid dataSourceType");
  }
}



get7daysRangedata() {
  const today = new Date();
console.log('Current date:', today);

// Calculate the most recent Sunday
const todayDayOfWeek = today.getDay();
const lastSunday = new Date(today);
lastSunday.setDate(today.getDate() - todayDayOfWeek);
console.log('Most recent Sunday:', lastSunday);

// Calculate the previous Sunday (7 days before the most recent Sunday)
const previousSunday = new Date(lastSunday);
previousSunday.setDate(lastSunday.getDate() - 7);
console.log('Previous Sunday:', previousSunday);

// Function to convert date to IST
function convertToIST(date) {
  const offset = 5.5 * 60; // IST offset in minutes
  const ISTDate = new Date(date.getTime() + offset * 60000);
  return ISTDate;
}

// Convert dates to IST
const lastSundayIST = convertToIST(lastSunday);
const previousSundayIST = convertToIST(previousSunday);

// Function to format dates to 'yyyy-MM-dd'
function formatDateToYYYYMMDD(date) {
  return date.toLocaleDateString('en-CA'); // 'en-CA' format is 'yyyy-MM-dd'
}

this.EndDate = formatDateToYYYYMMDD(lastSundayIST);
this.StartDate = formatDateToYYYYMMDD(previousSundayIST);

console.log('End Date (IST):', this.EndDate);
console.log('Start Date (IST):', this.StartDate);



  console.log(this.StartDate, this.EndDate);

  this.loader = true;

  let dataSubscription;
  if (this.dataSource === "Deposit") {
    dataSubscription = this.depositService.getDateDepositdata(this.StartDate, this.EndDate, this.size, this.page);
  } else if (this.dataSource === "Withdraw") {
    dataSubscription = this.depositService.getDateWithdrawdata(this.EndDate, this.StartDate, this.size, this.page);
  }

  if (dataSubscription) {
    dataSubscription.subscribe((data: any) => {
      console.log(data);
      this.deposits = data.content;
      console.log(this.deposits);
      this.totalElements = data.totalElements;
      this.cumulativeCount = (this.page * this.size);
      this.loader = false;
    }, (error) => {
      console.log(error);
      this.loader = false;
    });
  } else {
    this.loader = false;
    console.log("Invalid dataSourceType");
  }
}

getTodaysRangedata() {
  const today = new Date();
  console.log(today);

  // Format the date to 'yyyy-MM-dd'
  this.StartDate = formatDate(today, 'yyyy-MM-dd', 'en-US');
  this.EndDate = this.StartDate;
  console.log(this.StartDate, this.EndDate);

  this.loader = true;

  let dataSubscription;
  if (this.dataSource === "Deposit") {
    dataSubscription = this.depositService.getDateDepositdata(this.StartDate, this.EndDate, this.size, this.page);
  } else if (this.dataSource === "Withdraw") {
    dataSubscription = this.depositService.getDateWithdrawdata(this.StartDate, this.EndDate, this.size, this.page);
  }

  if (dataSubscription) {
    dataSubscription.subscribe((data: any) => {
      console.log(data);
      this.deposits = data.content;
      console.log(this.deposits);
      this.totalElements = data.totalElements;
      this.cumulativeCount = (this.page * this.size);
      this.loader = false;
    }, (error) => {
      console.log(error);
      this.loader = false;
    });
  } else {
    this.loader = false;
    console.log("Invalid dataSourceType");
  }
}

//======================================regarding-Search
onEnter(value: string) {
  if(value === ""){
    this.getdata();
  }else{
  // Method called when Enter key is pressed
  console.log('Enter key pressed with:', value);
  this.searchTerm = value;
  this.loader = true;
  console.log(this.dataSource ,this.StartDate, this.EndDate, "onenter");
  let dataSubscription;
  if (this.dataSource === "Deposit") {
    console.log(this.dataSource);
    if (this.StartDate && this.EndDate) {
      dataSubscription = this.searchService.getSearchRangeDepositdata(this.StartDate, this.EndDate, value, this.size, this.page);
    } else {
      dataSubscription = this.searchService.getSearchAllDepositData(value, this.size, this.page);
    }
  } else if (this.dataSource === "Withdraw") {
    console.log(this.dataSource +"in withdraw");
    if (this.StartDate && this.EndDate) {
      console.log(this.dataSource +"in daterange");
      dataSubscription = this.searchService.getSearchRangeWithdrawData(this.StartDate, this.EndDate, value, this.size, this.page);
    } else {
      console.log(this.dataSource +"in all data");
      dataSubscription = this.searchService.getSearchAllWithdrawData(value, this.size, this.page);
    }
  }

  if (dataSubscription) {
    dataSubscription.subscribe((data: any) => {
  
      this.deposits = data.content;
    
      this.totalElements = data.totalElements;
      this.cumulativeCount = (this.page * this.size);
      this.loader = false;
    }, (error) => {
      console.log(error);
      this.loader = false;
    });
  } else {
    this.loader = false;
    console.log("Invalid dataSourceType");
  }
}
}

//==============*onPageInputChange

 onPageInputChange(event: any) {
    let page = event.target.value - 1;
    if (page >= 0 && page < this.totalElements / this.size) {
      this.page = page;
      this.inputPage = page + 1; // Sync input field with paginator
   
      this.paginator.pageIndex = this.page; // Sync paginator with input field
      if(this.searchTerm){
        this.onEnter(this.searchTerm);
    
       }else{
    
        if(this.dataSourceType==="Lastweek's"){
          this.get7daysRangedata();
          }else if(this.dataSourceType==="Total"){
            if (this.EndDate) {
              this.getRangetotaldata();
          } else {
              this.gettotaldata();
          }
          }else if(this.dataSourceType==="Today's"){
            this.getTodaysRangedata();
          }
          console.log("outside");
        }
    }
  }

  


 resetPage(){ 
     this.page = 0;
     this.inputPage = 1; 

 }



 

 ///===============================EXCEL =================
 getRangeExceldata() {
  this.loader = true;
 
  let dataSubscription;
  if (this.dataSource === "Deposit") {
    dataSubscription = this.depositService.getDateDepositdata(this.StartDate, this.EndDate, this.totalElements, this.page);
  } else if (this.dataSource === "Withdraw") {
    console.log("hello world");
    dataSubscription = this.depositService.getDateWithdrawdata(this.StartDate, this.EndDate, this.totalElements, this.page);
  }

  if (dataSubscription) {
    dataSubscription.subscribe((data: any) => {
      console.log(data);
      this.excelData = data.content;
      console.log(this.excelData);
      this.exportAsXLSX()
      // this.totalElements = data.totalElements;
      // this.cumulativeCount = (this.page * this.size);
      this.loader = false;
    }, (error) => {
      console.log(error);
      this.loader = false;
    });
  } else {
    this.loader = false;
    console.log("Invalid dataSourceType");
  }
}

getTodayFailureExceldata() {
  this.loader = true;
 
  let dataSubscription;
  if (this.dataSource === "Deposit") {
    dataSubscription = this.depositService.getTodaysDepositFailuredata();
  } else if (this.dataSource === "Withdraw") {
    console.log("hello world");
    dataSubscription = this.depositService.getTodaysWithdrawFailuredata();
  }

  if (dataSubscription) {
    dataSubscription.subscribe((data: any) => {
      console.log(data);
      this.excelData = data;
      console.log(this.excelData);
      this.exportAsXLSX()
      // this.totalElements = data.totalElements;
      // this.cumulativeCount = (this.page * this.size);
      this.loader = false;
    }, (error) => {
      console.log(error);
      this.loader = false;
    });
  } else {
    this.loader = false;
    console.log("Invalid dataSourceType");
  }
}

getTodaySuccessExceldata() {
  this.loader = true;
 
  let dataSubscription;
  if (this.dataSource === "Deposit") {
    dataSubscription = this.depositService.getTodaysDepositSuccessdata();
  } else if (this.dataSource === "Withdraw") {
    console.log("hello world");
    dataSubscription = this.depositService.getTodaysWithdrawSuccessdata();
  }

  if (dataSubscription) {
    dataSubscription.subscribe((data: any) => {
      console.log(data);
      this.excelData = data;
      console.log(this.excelData);
      this.exportAsXLSX()
      // this.totalElements = data.totalElements;
      // this.cumulativeCount = (this.page * this.size);
      this.loader = false;
    }, (error) => {
      console.log(error);
      this.loader = false;
    });
  } else {
    this.loader = false;
    console.log("Invalid dataSourceType");
  }
}




exportAsXLSX(): void {
  this.loader = true;

  const isDeposit = this.dataSource === "Deposit";

  console.log("inside excel", this.excelData);

  const exportda = this.excelData.map(o => ({
    UserId: o.userId,
    ...(isDeposit && { UtrNumber: o.utrNumber }), // Include UtrNumber only if dataSource is "Deposit"
    Amount: parseFloat(o.amount), // Ensure Amount is a number
    Date: this.getFormattedDate(o.date),
    Status: o.status,
    BankName: o.bankDetails.bankName,
    SiteName: o.site.name,
    Botuser: o.dtoZuser.username,
  }));

  // Calculate total amount
  const totalAmount = exportda.reduce((sum, row) => sum + row.Amount, 0);

  // Create total amount row
  const totalAmountRow = {
    UserId: 'Total',
    ...(isDeposit && { UtrNumber: '' }), // Include UtrNumber column if needed
    Amount: totalAmount.toFixed(2), // Format total amount as a number with two decimal places
    Date: '',
    Status: '',
    BankName: '',
    SiteName: '',
    Botuser: '',
  };

  // Combine rows for final data
  const finalData = [...exportda, totalAmountRow];

  this.excelService.exportAsExcelFile(finalData, `${this.StartDate} to ${this.EndDate} ${this.dataSource} data`);
  this.loader = false;
}

//  exportAsXLSX(): void {
 
//   this.loader = true;

//   const isDeposit = this.dataSource === "Deposit";
 
//   console.log("in side excel"+this.excelData);
//   const exportda = this.excelData.map(o => (
//     {
   
//     UserId: o.userId,
    
//     ...(isDeposit && { UtrNumber: o.utrNumber }), // Include UtrNumber only if dataSource is "Deposit"
//     Amount: o.amount,
//     Date: this.getFormattedDate(o.date),
//     Status: o.status,
//     BankName: o.bankDetails.bankName,
//     SiteName: o.site.name,
//     Botuser: o.dtoZuser.username,
//   }));

//   // Create total amount row
//   const totalAmountRow = {
//     UserId: 'Total',
//     ...(isDeposit && { UtrNumber: '' }), // Include UtrNumber column if needed
//     // Amount: this.totalAmount,
//     Date: '',
//     Status: '',
//     SiteName: '',
//     Botuser: '',
//   };

//   // Combine rows for final data
//   const finalData = [...exportda, totalAmountRow];

//   this.excelService.exportAsExcelFile(finalData, `${this.StartDate} to ${this.EndDate} ${this.dataSource} data`);
//   this.loader = false;
// }


}


