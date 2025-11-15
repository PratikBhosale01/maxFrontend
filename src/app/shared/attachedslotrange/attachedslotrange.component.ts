import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { amountRange, Slot } from '../../domain/Bank';
import { SlotService } from '../../services/slot.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-attachedslotrange',
  templateUrl: './attachedslotrange.component.html',
  styleUrl: './attachedslotrange.component.scss'
})
export class AttachedslotrangeComponent {
  selectedSlot: number;
  selectedAmountRange: number;
  BankId:number;

  slots: Slot[] = [];          // List of slots
  amountRanges: amountRange[] = [];  // List of amount ranges
  loader: boolean ;
 
  constructor(
    public dialogRef: MatDialogRef<AttachedslotrangeComponent>,
    private slotService: SlotService,
    private snackbarService: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data,
  ) {
    this.BankId = data.id;
  
  }
  ngOnInit(){
    // this.loader =true;
    this.loadAmountRanges();
    this.loadSlots();
   
    this.selectedSlot = this.data.slot.id;
    this.selectedAmountRange = this.data.amountRange.id;
    
  }

  onAddOrUpdate(): void {
    // Handle the add or update logic here
    // console.log('Selected Slot:', this.selectedSlot);
    // console.log('Selected Amount Range:', this.selectedAmountRange);


    
    this.loader=true;
    this.slotService.attachToBankInfo(this.BankId, this.selectedSlot , this.selectedAmountRange).subscribe(
      response => {
        console.log('Slot attached successfully:', response);
        this.snackbarService.snackbar(` Slot and amount updated  successfully`, 'success');
        this.loader=false;
        this.dialogRef.close({
          slot: this.selectedSlot,
          amountRange: this.selectedAmountRange
        });
      },
      error => {
        this.snackbarService.snackbar('Error attaching slot!', 'error');
        console.error('Error attaching slot:', error);
        this.loader=false;
      }
    );
    

   
  }

  loadAmountRanges(): void {
    this.loader=true;
    this.slotService.getAmountRanges().subscribe(data => {
      this.amountRanges = data;
    
    }, error => {
      this.loader=false;
    });
  }

  loadSlots(): void {
   
    this.slotService.getSlots().subscribe(data => {
      this.slots = data.map(slot => ({ ...slot, isEditing: false }));
      this.loader=false;
    }, error => {
      this.loader=false;
    }
  );
  }

  

  
  

}
