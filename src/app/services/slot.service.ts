import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { amountRange, Slot } from '../domain/Bank';



@Injectable({
  providedIn: 'root'
})
export class SlotService {
  private apiUrl = 'http://localhost:9101/bankingservice/slots';
    baseUrl: String = this.config.getBaseurl(); // Backend URL

  constructor(private http: HttpClient , private config :AppConfigService) {}

  getSlots(): Observable<Slot[]> {
    return this.http.get<Slot[]>(`${this.baseUrl}/bankingservice/slots`);
  }


  addSlot(slot: Slot): Observable<Slot> {
    
    return this.http.post<Slot>(`${this.baseUrl}/bankingservice/slots`,slot);
  }
  updateSlot(slot: Slot): Observable<Slot> {
    return this.http.put<Slot>(`${this.baseUrl}/bankingservice/slots/${slot.id}`, slot);
  }
 
  getAmountRanges(): Observable<amountRange[]> {

    
    return this.http.get<amountRange[]>(`${this.baseUrl}/bankingservice/amount-ranges`);
  }

  updateAmountRange(amountRange: amountRange): Observable<amountRange> {
    return this.http.put<amountRange>(`${this.baseUrl}/bankingservice/amount-ranges/${amountRange.id}`, amountRange);
  }

  addAmountRange(amountRange:amountRange): Observable<amountRange> {
    
    return this.http.post<amountRange>(`${this.baseUrl}/bankingservice/amount-ranges`,amountRange);
  }

  attachToBankInfo(bankInfoId: number, slotId: number,amountRangeId:number): Observable<any> {
    const params =  new HttpParams()
    .set('bankInfoId', bankInfoId.toString())
    .set('slotId', slotId.toString())
    .set('amountRangeId', amountRangeId.toString())

    const url = `${this.baseUrl}/bankingservice/bankinfo/attachSlotAndAmountRange`;
   
    return this.http.put(url,  null, { params } );
  }

  // Attach Amount Range to BankInfo
  attachAmountRangeToBankInfo(bankInfoId: number, amountRangeId: number): Observable<any> {
    const url = `${this.baseUrl}/bankingservice/bankinfo/${bankInfoId}/attach-amount-range/${amountRangeId}`;
  
    return this.http.put(url, {},);
  }

  CheckBankAccount(amountslot:any): Observable<any> {
    
    return this.http.post<any>(`${this.baseUrl}/bankingservice/BankRegulator/getAllBanksBySlot`,amountslot);
  }

  unlinkSlotAmount(id:number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/bankingservice/bankinfo/unlinkSlotAndAmountRange/${id}`, amountRange);
  }

   
}
