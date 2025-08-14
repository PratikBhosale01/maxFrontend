import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { siteMaster } from '../domain/SiteMaster';

@Injectable({
  providedIn: 'root'
})
export class SiteMastersService {
  baseUrl: String = this.config.getBaseurl();
  private sitesSubject = new BehaviorSubject<siteMaster[]>([]);
  siteMasters$ = this.sitesSubject.asObservable();


  constructor(private http : HttpClient, private config :AppConfigService) {
   
    this.loadAllSiteMasters();
   }

  private loadAllSiteMasters(): void {
    this.http.get<siteMaster[]>(`${this.baseUrl}/approveOperation/siteMasterService/getAllSiteMasters`)
      .pipe(
        tap((sites: siteMaster[]) => this.sitesSubject.next(sites))
      )
      .subscribe();
  }

  
  getAllSitedata(): Observable<siteMaster[]> {
    console.log('Fetching siteMasters in service');
    return this.siteMasters$;
       
  
    }

    addSiteMaster(SiteMaster:siteMaster): Observable<any> {
      return this.http.post(`${this.baseUrl}/approveOperation/siteMasterService/addSiteMaster`, SiteMaster);
    }  


    deleteSiteMasters(SiteMasterID:number): Observable<any> {
      return this.http.delete<any>(`${this.baseUrl}/approveOperation/siteMasterService/deleteSiteMaster/${SiteMasterID}`);
     
    } 
    updateSiteMaster(SiteMaster :siteMaster,Id :number): Observable<any> {
      console.log('Updating siteMaster in service' + JSON.stringify(SiteMaster) + 'Id'+ Id  );
      return this.http.put<any>(`${this.baseUrl}/approveOperation/siteMasterService/updateSiteMaster/${Id}`, SiteMaster);
  
    }
}
