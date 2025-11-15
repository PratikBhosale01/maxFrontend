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

getAllFBankdata(): Observable<Bank[]> {
  return this.http.get<Bank[]>(`${this.baseUrl}/Bank/getFrozenBanks`);
} 

getAllBankStaticdata()
{
   this.getAllBankdata().subscribe((data) =>  {
      
    this.banksList = data;
      //  console.log(this.banksList);
      // this.formGroup.get('bankId').updateValueAndValidity() // Trigger valueChanges after banksList is loaded
  });
  
}

/**
 * Fetch device names for a zuser (used as a device-specific bank list for withdraw flow)
 * Endpoint: GET /zusers/{zuserId}/deviceNames
 * Returns an array (raw) — caller can map/transform as needed.
 */
getDeviceNamesForZuser(zuserId: string | number): Observable<any[]> {

  return this.http.get<any[]>(`${this.baseUrl}/zusers/${zuserId}/deviceNames`).pipe(
    catchError((error: HttpErrorResponse) => {
      // Let the caller handle fallback; return an observable error
      return throwError(() => error);
    })
  );
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
  ).pipe(
    catchError((error) => {
      // Pass the error to the component, do not propagate to global error handler
      return throwError(() => error);
    })
  );
}

  /**
   * Fetch transactions (statement) for a bank account / bank id.
   * Assumption: backend has endpoint at /operation/bank/transactions/{bankId}
   */
  /**
   * Fetch paginated transactions for a bank.
   * Endpoint provided by user: GET /Bank/bankTransaction/getTransactionsByBankId/{bankId}?pageNo={pageNo}&pageSize={pageSize}
   * Returns a paginated response (content, pageable, totalElements, totalPages, etc.)
   */
  getBankTransactions(bankId: number, pageNo: number = 0, pageSize: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('pageNo', String(pageNo))
      .set('pageSize', String(pageSize));
    return this.http.get<any>(`${this.baseUrl}/Bank/bankTransaction/getTransactionsByBankId/${bankId}`, { params });
  }

  /**
   * Fetch bank details by id
   * Endpoint provided by user: GET /Bank/getBankById/{id}
   */
  getBankById(bankId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Bank/getBankById/${bankId}`);
  }

  /**
   * Process a bank transaction (add voucher).
   * Endpoint: POST /Bank/bankTransaction/processTransaction/{bankId}/{flowType}
   * All other fields should be sent in the request body.
   */
  processTransaction(bankId: number, flowType: string, body: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/Bank/bankTransaction/processTransaction/${bankId}/${flowType}`,
      body
    );
  }

}

