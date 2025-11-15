export interface BankAccount{
    id?:Number;
    bankName: string;
    accountHolder: string;
    accId: string;
    ifscCode: string;
    branchName ?: string;
    freeze: boolean;
    balance: number;
     
  }

  export interface BankAccountTransfer{
    id:number;
    amount: number; 
    opNumber:number;
  }

  export interface Bank{
displayName?: string;
    accountHolder?: string;
    bankId?: string;
    id?:Number;
    bankName?: string;
    bankHolderName?: string;
    ifscCode?: string;
    balance?: number; 
    gpayUPI?:string;
    phonePeUPI?:string;
    upiId?:string;
    active?:boolean; 
    scannerName?:string ,
    qrLink1?:string ,
    qrLink2?:string ,
    branchName?:string ,
  }

  export class Slot {
    id?: number;
    startTime?: string; // LocalTime format
    endTime?: string;
    isEditing?: boolean;
  }

  export class amountRange {
    id?: number;
    minAmount?: number; // LocalTime format
    maxAmount?: number;
    isEditing?: boolean;
  }

  