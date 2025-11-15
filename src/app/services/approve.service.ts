import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { appvWithdraw, DepositeWithdraw } from '../domain/Deposite';
import { map, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ApproveService {
 


  constructor(public http: HttpClient, private config: AppConfigService) {
    // this.connection = Stomp.client('ws://localhost:8080/websocket');
    // this.connection.connect({}, () => {});

  }
  baseUrl: String = this.config.getBaseurl();
  // private connection: any;
  // private subscription: any;


  deposite(deposite: DepositeWithdraw): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/approveOperation/approveDeposit`, deposite);
  }

  depositeChatId(deposite: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/approveOperation/approveDepositWithUtrExtraction`, deposite);
  }

  withdraw(withdraw: appvWithdraw): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/approveOperation/withdraw/approveWithdraw`, withdraw);
  }

  getAllApprvDepo(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/approveOperation/getAllApproveDeposits`);
  }

  Approve(Id:number ,retry:number ,userId:number){
    const params =  new HttpParams()
    .set('id', Id.toString())
    .set('retry', retry.toString())
    .set('executedById', userId.toString())
    return this.http.put<any>(`${this.baseUrl}/approveOperation/approve`, null, { params });

  }

  Approvecheck(Id:number ,retry:number ,userId:number,approveDeposit:any) {
    const params =  new HttpParams()
    .set('id', Id.toString())
    .set('retry', retry.toString())
    .set('executedById', userId.toString())

    return this.http.put<any>(`${this.baseUrl}/approveOperation/approve`, approveDeposit, { params });

  }

  ApproveCheckWithdraw(Id:number,userId:number,approveWithdraw:any) {
    const params =  new HttpParams()
    .set('id', Id.toString())
    .set('executedById', userId.toString())
    return this.http.put<any>(`${this.baseUrl}/approveOperation/withdraw/approve`, approveWithdraw, { params });

  }




  retry(Id:number ,retry:boolean, obj:any) {
    const params =  new HttpParams()
    .set('approveId', Id)
    
    // .set('retry', retry)
    return this.http.put<any>(`${this.baseUrl}/approveOperation/approveRetry`, obj, { params });

  }

  retryWithdraw(id){
    const params =  new HttpParams()
    .set('approveId', id)
    
    // .set('retry', retry)
    return this.http.put<any>(`${this.baseUrl}/approveOperation/withdraw/approveRetry`, null, { params });

  }
  searchWithdraws(statuses ,searchTerm: string, pageSize: number, pageNo: number) {
    const params =  new HttpParams()
    .set('status', statuses)
    .set('searchTerm', searchTerm)
    .set('page', pageNo.toString())
    .set('size', pageSize.toString())


    return this.http.get<any>(`${this.baseUrl}/approveOperation/approve-deposits/search`, { params });
  }

  searchDeposits(statuses ,searchTerm: string, pageSize: number, pageNo: number) {
    const params =  new HttpParams()
    .set('status', statuses)
    .set('searchTerm', searchTerm)
    .set('page', pageNo.toString())
    .set('size', pageSize.toString())


    return this.http.get<any>(`${this.baseUrl}/approveOperation/approve-deposits/search`, { params });
  }

  Reject(Id:number,rejectReason:string ,userId:number): Observable<any> {
    const params =  new HttpParams()
   .set('id', Id.toString())
   .set('rejectReason', rejectReason)
   .set('executedById', userId.toString())

    return this.http.put<any>(`${this.baseUrl}/approveOperation/reject`,null,{ params });
  }

  RejectApproveAdmin(Id:number,rejectReason:string ,userId:number): Observable<any> {
    const params =  new HttpParams()
    .set('id', Id.toString())
   .set('rejectReason', rejectReason)
   .set('executedById', userId.toString())

    return this.http.put<any>(`${this.baseUrl}/approveOperation/adminReject`,null,{ params });
  }


 

  RejectApprove(Id:number,rejectReason:string ,userId:number): Observable<any> {
    const params =  new HttpParams()
    .set('id', Id.toString())
   .set('rejectReason', rejectReason)
   .set('executedById', userId.toString())

    return this.http.put<any>(`${this.baseUrl}/approveOperation/rejectWati`,null,{ params });
  }

 
  RejectWithdraw(Id:number,rejectReason:string ,userId:number): Observable<any> {
    const params =  new HttpParams()
   .set('id', Id.toString())
   .set('rejectReason', rejectReason)
   .set('executedById', userId.toString())

    return this.http.put<any>(`${this.baseUrl}/approveOperation/withdraw/reject`,null,{ params });
  }

  manualApprove(utr:String): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/approveOperation/updateApproveStatus/${utr}`,null);
   
  }

  getSelectiondata(statuses , pageSize:number, pageNo:number): Observable<any>{
    const params =  new HttpParams()
     .set('statuses', statuses)
    .set('pageSize', pageSize.toString())
    .set('pageNo', pageNo.toString());

    return this.http.get<any>(`${this.baseUrl}/approveOperation/listByApproveStatus`,{params});

  }

  getRejectedSelectiondata(statuses , pageSize:number, pageNo:number): Observable<any>{
    const params =  new HttpParams()
     .set('statuses', statuses)
    .set('pageSize', pageSize.toString())
    .set('pageNo', pageNo.toString());

    return this.http.get<any>(`${this.baseUrl}/approveOperation/getApproveDepositsByStatusesAndUnderReview`,{params});

  }

  get200appvd(): Observable<any>{
 
    return this.http.get<any>(`${this.baseUrl}/approveOperation/last-200-approve-deposits`);

  }

  getSelectionWithdrawdata(statuses , pageSize:number, pageNo:number, waNum: number): Observable<any>{
    const params =  new HttpParams()
    .set('statuses', statuses)
    .set('pageSize', pageSize.toString())
    .set('pageNo', pageNo.toString())
    .set('watiNumber', waNum.toString());

    return this.http.get<any>(`${this.baseUrl}/approveOperation/withdraw/listByApproveStatus`,{params});

  }

  getApprvReportdata(zuserId:number): Observable<any>{
   

    return this.http.get<any>(`${this.baseUrl}/approveOperation/getLatest200DepositsByZuserId/${zuserId}`);

  }

  deleteReport(Id:number, Zuser:number){
    const params =  new HttpParams()
    
    .set('id', Id.toString())
    .set('executedById', Zuser.toString());

    return this.http.put<any>(`${this.baseUrl}/approveOperation/delete`,null ,{params});
  }


  deleteWithdraw(Id:number, Zuser:number){
    const params =  new HttpParams()
    
    .set('id', Id.toString())
    .set('executedById', Zuser.toString());

    return this.http.put<any>(`${this.baseUrl}/approveOperation/withdraw/delete` ,null,{params});
  }

  //==================

  // Method to listen to WebSocket and call a callback function
  // public listen(fun: (message: any) => void): void {
  //   if (this.connection) {
  //     this.connection.connect({}, () => {
  //       this.subscription = this.connection!.subscribe(
  //         '/tasks/added_task',
  //         (message) => fun(JSON.parse(message.body))
  //       );
  //     });
  //   }
  // }

    // Combined method that listens to WebSocket and fetches data
    // public listenAndFetchData(statuses: string[], pageSize: number, pageNo: number, callback: (data: any) => void): void {
    //   this.listen((message) => {
    //     this.getSelectiondata(statuses, pageSize, pageNo)
    //       .pipe(map((response) => ({ message, response })))
    //       .subscribe((data) => callback(data));
    //   });
    // }
// weqrc  : string  
updateApproveDeposit(id: number, data: { utrNumber: string; amount: string; bankId: number }) {
  return this.http.put<any>(`${this.baseUrl}/approveOperation/updateApproveDeposit/${id}`, data);
}                                                                                                             
 sendWithdrawMsg1(id: number, withdrawMsg: any){
   
  return this.http.put<any>(`${this.baseUrl}/approveOperation/withdraw/messageSentWatiWith/${id}`, withdrawMsg);
}

sendWithdrawMsg(
  id: number,
  userId: any,
  bankId: number,
  chatid: number,
  utr: string,
  neftPayment: any,
  file?: File,
  bankName?:string,
  deviceName?:string
) {
  const formData = new FormData();
  formData.append('approveId', id.toString());
  if (bankId !== null && bankId !== undefined) {
    formData.append('bankId', bankId.toString());
  }else{
    formData.append('bankId', null);
  }
  formData.append('utr', utr);
  formData.append('executedById', userId.toString());
  if (neftPayment !== null && neftPayment !== undefined) {
    formData.append('neftPayment', neftPayment.toString());
  }
  // if(bankName!==null){
  //   formData.append('bankId',bankName.toString());
  // }
  if(deviceName!==null){
  formData.append('deviceName',deviceName.toString());
}else{
  formData.append('deviceName', null);
}
  if (file) {
    formData.append('bankUtrImage', file);
  }

  return this.http.put<any>(
    `${this.baseUrl}/approveOperation/withdraw/notifyWithdrawalSuccess`,
    formData
  );
}

sendWMsg(
  id: number,
  userId: any,
  bankId: number,
  chatid: number,
  utr: string,
  neftPayment: any,
  file?: File,
  amount?:number,
  bankName?:string,
  deviceName?:string
) {
  const formData = new FormData();
  formData.append('approveId', id.toString());
  if (bankId !== null && bankId !== undefined) {
    formData.append('bankId', bankId.toString());
  }
  formData.append('utr', utr);
  formData.append('executedById', userId.toString());
  if (neftPayment !== null && neftPayment !== undefined) {
    formData.append('neftPayment', neftPayment.toString());
  }
  if (amount !== null && amount !== undefined) {
    formData.append('amount', amount.toString());
  }
  if (bankName !== null && bankName !== undefined) {
    formData.append('bankId', bankName.toString());
  }else{
    formData.append('bankId', null);
  }
  if (deviceName !== null && deviceName !== undefined) {
    formData.append('deviceName', deviceName.toString());
  }else{
    formData.append('deviceName', null);
  }
  if (file) {
    formData.append('bankUtrImage', file);
  }

  return this.http.put<any>(
    `${this.baseUrl}/approveOperation/withdraw/sendMessage`,
    formData
  );
}

getWithdrawObjById(Id:Number){
     
      return this.http.get<any>(`${this.baseUrl}/approveOperation/withdraw/findById/${Id}`);
}

getDepositObjById(Id:Number){
     
  return this.http.get<any>(`${this.baseUrl}/approveOperation/getApproveDepositById/${Id}`);
}
  
}
