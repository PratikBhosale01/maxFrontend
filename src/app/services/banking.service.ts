import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { DepositeWithdraw } from '../domain/Deposite';
import { Bank, BankAccount, BankAccountTransfer, Slot } from '../domain/Bank';

@Injectable({
  providedIn: 'root'
})
export class BankingService {
  private bankAccountsSubject = new BehaviorSubject<BankAccount[]>([]);
  bankAccounts$ = this.bankAccountsSubject.asObservable();

  private botBankAccountsSubject = new BehaviorSubject<Bank[]>([]);
  botBankAccounts$ = this.botBankAccountsSubject.asObservable();

  private BankListSubject = new BehaviorSubject<Bank[]>([]);
  bankList$ = this.BankListSubject.asObservable();

  banksList: Bank[];


  constructor(public http: HttpClient, private config: AppConfigService) {
    this.loadAllAccountData();
    this.loadAllBotAccountData();
    this.getAllBankStaticdata();
    this.loadBankList();
  }
  baseUrl: String = this.config.getBaseurl();

  private loadAllAccountData(): void {
    this.http.get<BankAccount[]>(`${this.baseUrl}/operation/bank/getAllBanks`)
      .pipe(
        tap((accounts: BankAccount[]) => this.bankAccountsSubject.next(accounts))
      )
      .subscribe();
  }


  private loadAllBotAccountData(): void {
    this.http.get<Bank[]>(`${this.baseUrl}/Bank/getAllBanks`)
      .pipe(
        tap((accounts:Bank[]) => this.botBankAccountsSubject.next(accounts))
      )
      .subscribe();
  }

  

  private loadBankList(): void {
    this.http.get<Bank[]>(`${this.baseUrl}/Bank/getAllBanks`)
      .pipe(
        tap((accounts:Bank[]) => this.BankListSubject.next(accounts))
      )
      .subscribe();
  } 

  getBankListdata(): Observable<Bank[]>{
    // console.log("con" + this.bankList$);
    return this.bankList$;
  }

  getAllAccountdata(): Observable<BankAccount[]> {
  return this.bankAccounts$;
     

  }

  getAllBotAccountdata(): Observable<Bank[]> {
    return this.botBankAccounts$;
       
  
  }
  //===========normal function =================================

    addAccount(BankAccount :BankAccount): Observable<any> {
      return this.http.post<any>(`${this.baseUrl}/operation/bank/addBankDetails`, BankAccount);
    }
  
    transferAmount( BankAccountTransfer:BankAccountTransfer ): Observable<any> {
     
      return this.http.post(`${this.baseUrl}/operation/bank/transactionByOpNumber`,BankAccountTransfer);
    }
  
  updateBankAccount(BankAccount :any,Id :number): Observable<any> {
    // return this.http.put<any>(`${this.baseUrl}/Bank/updateBank/${Id}`, BankAccount);
    return this.http.put<any>(`${this.baseUrl}/Bank/updateBank/${Id}`, BankAccount, {
      headers: {
        // Don't set Content-Type header, let the browser set it with the boundary
        'Accept': 'application/json'
      }
    });

  }


  getCountFreezeAccount(): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/operation/bank/countFreezeAccounts`
    );
  }
  getCountActiveAccount(): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/operation/bank/countActiveAccounts`
    );
  }
  deleteBank(BankID:number): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/operation/bank/deleteBank/${BankID}`
      ///report/todayDeposite/${userID}
    );
  }

getActiveList() :Observable<any> {
  return this.http.get<BankAccount[]>(`${this.baseUrl}/operation/bank/activeAccountsList`);
}  

getFreezList() :Observable<any> {
  return this.http.get<BankAccount[]>(`${this.baseUrl}/operation/bank/frozenAccountList`);
} 

switch (Id : number, ) : Observable<any> {
  return this.http.put<any>(`${this.baseUrl}/Bank/toggleActiveStatus/${Id}`,null);
  
}

createBank(bankData: FormData): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/Bank/createBank`, bankData, {
    headers: {
      // Don't set Content-Type header, let the browser set it with the boundary
      'Accept': 'application/json'
    }
  });
}


bankUpdate(Bank:Bank ,Id :number ): Observable<any> {
  return this.http.put<any>(`${this.baseUrl}/bankingservice/bankinfo/${Id}`,  Bank);
}


Freez( Id :number ): Observable<any> {
  return this.http.put<any>(`${this.baseUrl}/bankingservice/bankinfo/${Id}`,null);
}
     

getAllBankdata(): Observable<Bank[]> {
  return this.http.get<Bank[]>(`${this.baseUrl}/Bank/getAllBanks`);
} 

getAllBankStaticdata()
{
   this.getAllBankdata().subscribe((data) =>  {
      
    this.banksList = data;
      //  console.log(this.banksList);
      // this.formGroup.get('bankId').updateValueAndValidity() // Trigger valueChanges after banksList is loaded
  });
  
}


getCountAllBotAccount(): Observable<any> {
  return this.http.get<any>(
    `${this.baseUrl}/Bank/active-count`
  );
}

addSlot(slot: Slot): Observable<Slot> {
  return this.http.post<Slot>(`${this.baseUrl}/Bank/slots`, slot);
}

getAvailableBanksByTimeSorted(time: string): Observable<any[]> {
  return this.http.post<any[]>(
    `${this.baseUrl}/Bank/getAvailableBanksByTimeSorted`,
    { time }
  );
}

}

