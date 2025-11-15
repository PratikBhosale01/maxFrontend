import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BankingService } from '../../services/banking.service';

@Component({
  selector: 'app-voucher-dialog',
  templateUrl: './voucher-dialog.component.html',
  styleUrls: ['./voucher-dialog.component.scss']
})
export class VoucherDialogComponent implements OnInit {
  form: FormGroup;
  accounts: any[] = [];
  loadingAccounts = false;
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<VoucherDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private bankingService: BankingService
  ) {
    console.log('VoucherDialog data:', data);
    // Single account selector with role (FROM/TO). If dialog was opened from a bank, the other side will be filled automatically.
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      transactionNote: [''],
      remark: [''],
      flowType: ['', Validators.required],
      fromAccount: [null],
      toAccount: [null]
    });
  }

  ngOnInit(): void {
  this.loadingAccounts = true;
    // get available accounts from the banking service
    this.bankingService.getAllAccountdata().subscribe(
      (accs) => {
        this.accounts = accs || [];
        this.loadingAccounts = false;
      },
      () => (this.loadingAccounts = false)
    );

    // If caller passed a bank, we can pre-select a sensible default for flowType
    if (this.data?.bank) {
      // default to CREDIT so the user will pick a fromAccount (external) by default
      this.form.patchValue({ flowType: 'CREDIT' });
    }

    // react to flowType changes to toggle which account is required
    this.form.get('flowType')?.valueChanges.subscribe((ft) => {
      const fromCtrl = this.form.get('fromAccount');
      const toCtrl = this.form.get('toAccount');
      if (ft === 'CREDIT') {
        fromCtrl?.setValidators([Validators.required]);
        toCtrl?.clearValidators();
        toCtrl?.setValue(null);
      } else if (ft === 'DEBIT') {
        toCtrl?.setValidators([Validators.required]);
        fromCtrl?.clearValidators();
        fromCtrl?.setValue(null);
      } else {
        fromCtrl?.clearValidators();
        toCtrl?.clearValidators();
      }
      fromCtrl?.updateValueAndValidity();
      toCtrl?.updateValueAndValidity();
    });
  }

  submit() {
    if (this.form.invalid) return;
    const v = this.form.value;
    // Build normalized payload using fromAccount / toAccount depending on flowType.
    const payload: any = {
      amount: v.amount,
      trxNote: v.transactionNote,
      remark: v.remark,
      flowType: v.flowType
    };

    // If dialog was opened with a bank context, map the other side to that bank id
    if (this.data?.bank && this.data.bank.id != null) {
      const bankId = this.data.bank.id;
      if (v.flowType === 'CREDIT') {
        payload.fromAccount = v.fromAccount;
        payload.toAccount = bankId;
      } else if (v.flowType === 'DEBIT') {
        payload.fromAccount = bankId;
        payload.toAccount = v.toAccount;
      }
    } else {
      // No bank context - use selected from/to according to flowType
      if (v.flowType === 'CREDIT') payload.fromAccount = v.fromAccount;
      if (v.flowType === 'DEBIT') payload.toAccount = v.toAccount;
    }

    // Determine bankId for the path param. Prefer dialog-provided bank; fall back to selected account depending on flow.
    const bankId = this.data?.bank?.id ?? (v.flowType === 'CREDIT' ? v.toAccount : v.fromAccount);
    if (bankId == null) {
      // cannot proceed without a bankId in the path
      console.error('Missing bankId for voucher submission', { payload });
      return;
    }

    this.isSubmitting = true;
    this.form.disable();
    this.bankingService.processTransaction(bankId, v.flowType, payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.form.enable();
        console.error('Failed to process voucher', err);
        // Keep dialog open so user can retry or inspect; optionally you can show an error message here
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
