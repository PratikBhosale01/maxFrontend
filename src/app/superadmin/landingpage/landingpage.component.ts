
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SuperAdminLandingService } from '../../services/super-admin-landing.service';
import { Subscription } from 'rxjs';
// @ts-ignore
import Chart from 'chart.js/auto';
import { ChartsService } from '../../services/charts.service';
import { MatDialog } from '@angular/material/dialog';
import { UsertableModalComponent } from '../usertable-modal/usertable-modal.component';
import { ComponettitleService } from '../../services/componenttitle.service';


@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrl: './landingpage.component.scss',
})

export class LandingpageComponent implements OnInit {
  // ...existing code...

  showDepositBothMetrics(): void {
    if (!this.depositChart) return;
    this.depositChart.data.datasets[0].hidden = false;
    this.depositChart.data.datasets[1].hidden = false;
    // @ts-ignore
    this.depositChart.options.scales.y.display = true;
    // @ts-ignore
    this.depositChart.options.scales.y1.display = true;
    this.depositChart.update();
  }

  showDepositCountOnly(): void {
    if (!this.depositChart) return;
    this.depositChart.data.datasets[0].hidden = false;
    this.depositChart.data.datasets[1].hidden = true;
    // @ts-ignore
    this.depositChart.options.scales.y.display = true;
    // @ts-ignore
    this.depositChart.options.scales.y1.display = false;
    this.depositChart.update();
  }

  showDepositAmountOnly(): void {
    if (!this.depositChart) return;
    this.depositChart.data.datasets[0].hidden = true;
    this.depositChart.data.datasets[1].hidden = false;
    // @ts-ignore
    this.depositChart.options.scales.y.display = false;
    // @ts-ignore
    this.depositChart.options.scales.y1.display = true;
    // @ts-ignore
    this.depositChart.options.scales.y1.position = 'left';
    this.depositChart.update();
  }
  todayDeposit: number = 0;
  todayWithdraw: number = 0;
  totalusers: number = 0;
  todayClients: number = 0;
  name = '';
  previousData: any = {};
  deposit: any;
  previousDeposit: number;
  private depositSubscription: Subscription;
  chartDepositData: any[];
  charrtWithdrawData: any[];
  @ViewChild('transactionChart') transactionChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('depositTransactionChart') depositTransactionChart!: ElementRef<HTMLCanvasElement>;

  currentdepo: number;
  data: any[] = [];
  depositData: any[] = [];

  loader: boolean = false;
  todayCounts: number = 0;
  todayWCounts: number = 0;
  totalTransactions = 0;
  totalAmount = '';
  avgTransactions = 0;
  avgAmount = '';

  depositTotalTransactions = 0;
  depositTotalAmount = '';
  depositAvgTransactions = 0;
  depositAvgAmount = '';

  chart!: Chart;
  depositChart!: Chart;

  constructor(
    private route: Router,
    private landingservice: SuperAdminLandingService,
    private cdRef: ChangeDetectorRef,
    private chartDataService: ChartsService,
    public dialog: MatDialog,
    private titleService: ComponettitleService
  ) {}

  ngOnInit(): void {
    this.titleService.changeTitle('Dashboard panel');
    this.fetchData();
  }

  fetchData() {
    this.getUser();
    this.getDeposite();
    this.getWithdraW();
    this.getWithdrawChartData();
    this.getDepositChartData();
  }

  getDeposite() {
    this.landingservice.getTodaysDeposit().subscribe(
      (data) => {
        if (data != this.currentdepo || this.todayDeposit === 0) {
          this.todayDeposit = data.amount;
          this.todayCounts = data.count;
          this.currentdepo = this.todayDeposit;
        }
        //  else{
        //   this.todayDeposit=0;
        //  }
      },
      (error) => {
        console.error(error);
        // Handle error
      }
    );
  }

  getClientCount() {
    this.landingservice.getTodaysClient().subscribe(
      (data) => {
        if (data != this.currentdepo || this.todayDeposit === 0) {
          this.todayClients = data;
        }
      },
      (error) => {
        console.error(error);
      
      }
    );
  }

  getWithdraW() {
    this.landingservice.getTodaysWithdraw().subscribe(
      (data) => {
        this.todayWithdraw = data.amount;
        this.todayWCounts = data.count;
      },
      (error) => {
        console.error(error);
        // Handle error
      }
    );
  }

  getUser() {
    this.landingservice.getUser().subscribe(
      (data) => {
        this.totalusers = data;
      },
      (error) => {
        console.error(error);
        // Handle error
      }
    );
  }

  // dataChanged(newData: any): boolean {
  //   // Compare new data with previous data
  //   // Implement your comparison logic here based on your data structure
  //   // For simplicity, assuming newData and previousData are JSON objects
  //   return JSON.stringify(newData) !== JSON.stringify(this.previousData);
  // }


  getDepositChartData() {
    this.chartDataService.getDepositChartData().subscribe(
      (data) => {
        this.depositData = data;
        this.createDepositTransactionChart();
        this.updateDepositStats();
      },
      (error) => {
        console.error(error);
      }
    );
  }
  private getDepositChartLabels(): string[] {
    if (!Array.isArray(this.depositData)) {
      return [];
    }
    return this.depositData.map((item: any) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
  }

  private getDepositCountSeries(): number[] {
    return Array.isArray(this.depositData) ? this.depositData.map((item: any) => item.count ?? 0) : [];
  }

  private getDepositAmountSeries(): number[] {
    return Array.isArray(this.depositData) ? this.depositData.map((item: any) => item.totalAmount ?? 0) : [];
  }

  createDepositTransactionChart(): void {
    if (!this.depositTransactionChart) {
      return;
    }

    const canvas = this.depositTransactionChart.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Create gradients for lines
    const goldGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    goldGradient.addColorStop(0, '#ffd700');
    goldGradient.addColorStop(1, '#ffe28a');
    const brownGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    brownGradient.addColorStop(0, '#926108');
    brownGradient.addColorStop(1, '#b39b33');

    // Destroy existing instance
    if (this.depositChart) {
      this.depositChart.destroy();
    }

    const labels = this.getDepositChartLabels();
    const counts = this.getDepositCountSeries();
    const amounts = this.getDepositAmountSeries();

    this.depositChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Deposit Count',
            data: counts,
            borderColor: goldGradient,
            backgroundColor: 'rgba(242, 214, 55, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ffe28a',
            pointBorderColor: '#ffd700',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: 'y',
          },
          {
            label: 'Total Amount (₹)',
            data: amounts,
            borderColor: brownGradient,
            backgroundColor: 'rgba(146, 97, 8, 0.10)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#b39b33',
            pointBorderColor: '#926108',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 15, weight: 'bold' },
              color: '#7c7b7bff',
              boxWidth: 18,
              boxHeight: 18,
            },
            title: {
              display: false,
            },
          },
          tooltip: {
            backgroundColor: '#d9d182ff',
            titleColor: '#464646ff',
            bodyColor: '#926108',
            borderColor: '#ffd700',
            borderWidth: 2,
            cornerRadius: 12,
            displayColors: true,
            callbacks: {
              label: (context: any) => {
                if (context.datasetIndex === 1) {
                  return context.dataset.label + ': ' + this.formatCurrency(context.raw);
                }
                return context.dataset.label + ': ' + context.raw;
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date',
              font: { size: 15, weight: 'bold' },
              color: '#999999ff',
            },
            grid: { color: 'rgba(122, 122, 121, 0.08)' },
            ticks: { color: '#989898ff', font: { weight: 'bold' } },
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Deposit Count',
              color: '#ffd700',
              font: { size: 15, weight: 'bold' },
            },
            grid: { color: 'rgba(255, 215, 0, 0.10)' },
            ticks: { color: '#ffd700', font: { weight: 'bold' } },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Total Amount (₹)',
              color: '#908f8fff',
              font: { size: 15, weight: 'bold' },
            },
            grid: { drawOnChartArea: false, color: 'rgba(146, 97, 8, 0.10)' },
            ticks: {
              color: '#929090ff',
              font: { weight: 'bold' },
              callback: (value: any) => this.formatCurrency(Number(value)),
            },
          },
        },
        animation: { duration: 800, easing: 'easeInOutQuart' },
      },
    });
  }

  updateDepositStats(): void {
    if (!Array.isArray(this.depositData) || this.depositData.length === 0) {
      this.depositTotalTransactions = 0;
      this.depositTotalAmount = this.formatCurrency(0);
      this.depositAvgTransactions = 0;
      this.depositAvgAmount = this.formatCurrency(0);
      return;
    }

    const totalTransactions = this.depositData.reduce((sum: number, item: any) => sum + (item.count ?? 0), 0);
    const totalAmountRaw = this.depositData.reduce((sum: number, item: any) => sum + (item.totalAmount ?? 0), 0);
    const avgTransactions = Math.round(totalTransactions / this.depositData.length);
    const avgAmountRaw = Math.round(totalAmountRaw / this.depositData.length);

    this.depositTotalTransactions = totalTransactions;
    this.depositTotalAmount = this.formatCurrency(totalAmountRaw);
    this.depositAvgTransactions = avgTransactions;
    this.depositAvgAmount = this.formatCurrency(avgAmountRaw);
  }



getWithdrawChartData() {
  this.chartDataService.getWithdrawalChartData().subscribe(
    (data) => {
      this.data = data;
    

      // Create/refresh combined chart and stats
      this.createTransactionChart();
      this.updateStats();

    
    },
    (error) => {
      console.error(error);
    }
  );
}










  navigateToPage(component: String): void {
    this.route.navigateByUrl(`SA/${component}`);
  }

  
  
  fetchDataFromBackend() {
    this.loader = true;
    // Perform backend API call or any other method to fetch data
    this.landingservice.getAllUsers().subscribe(
      (data) => {
       
        this.openDialog(data);
        this.loader = false; // Set loader to false after data is fetched
      },
      (error) => {
        console.error('Error fetching data:', error);
        this.loader = false; // Set loader to false if there's an error
      }
    );
  }
  openDialog(tableData: any): void {
    this.dialog.open(UsertableModalComponent, {
      width: '70%',
      data: { tableData },
    });
  }


  // ================= Combined Transaction Chart (Count + Amount) =================
  private formatCurrency(value: number): string {
    if (value === null || value === undefined) {
      return '₹0.0L';
    }
    return '₹' + (value / 100000).toFixed(1) + 'L';
  }

  private getChartLabels(): string[] {
    if (!Array.isArray(this.data)) {
      return [];
    }
    return this.data.map((item: any) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
  }

  private getCountSeries(): number[] {
    return Array.isArray(this.data) ? this.data.map((item: any) => item.count ?? 0) : [];
  }

  private getAmountSeries(): number[] {
    return Array.isArray(this.data) ? this.data.map((item: any) => item.totalAmount ?? 0) : [];
  }

  createTransactionChart(): void {
    if (!this.transactionChart) {
      return;
    }

    const canvas = this.transactionChart.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Create gradients for lines
    const goldGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    goldGradient.addColorStop(0, '#ffd700');
    goldGradient.addColorStop(1, '#ffe28a');
    const brownGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    brownGradient.addColorStop(0, '#926108');
    brownGradient.addColorStop(1, '#b39b33');

    // Destroy existing instance
    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.getChartLabels();
    const counts = this.getCountSeries();
    const amounts = this.getAmountSeries();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Transaction Count',
            data: counts,
            borderColor: goldGradient,
            backgroundColor: 'rgba(255, 215, 0, 0.10)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ffe28a',
            pointBorderColor: '#ffd700',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: 'y',
          },
          {
            label: 'Total Amount ($)',
            data: amounts,
            borderColor: brownGradient,
            backgroundColor: 'rgba(146, 97, 8, 0.10)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#b39b33',
            pointBorderColor: '#926108',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 15, weight: 'bold' },
              color: '#8d8d8dff',
              boxWidth: 18,
              boxHeight: 18,
            },
            title: {
              display: false,
            },
          },
          tooltip: {
            backgroundColor: '#dbd9d4ff',
            titleColor: '#000000ff',
            bodyColor: '#926108',
            borderColor: '#ffd700',
            borderWidth: 2,
            cornerRadius: 12,
            displayColors: true,
            callbacks: {
              label: (context: any) => {
                if (context.datasetIndex === 1) {
                  return context.dataset.label + ': ' + this.formatCurrency(context.raw);
                }
                return context.dataset.label + ': ' + context.raw;
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date',
              font: { size: 15, weight: 'bold' },
              color: '#878787ff',
            },
            grid: { color: 'rgba(255, 215, 0, 0.08)' },
            ticks: { color: '#928f8bff', font: { weight: 'bold' } },
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Transaction Count',
              color: '#ffffffff',
              font: { size: 15, weight: 'bold' },
            },
            grid: { color: 'rgba(66, 66, 65, 0.1)' },
            ticks: { color: '#414040ff', font: { weight: 'bold' } },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Total Amount ($)',
              color: '#888888ff',
              font: { size: 15, weight: 'bold' },
            },
            grid: { drawOnChartArea: false, color: 'rgba(146, 97, 8, 0.10)' },
            ticks: {
              color: '#8b8b8bff',
              font: { weight: 'bold' },
              callback: (value: any) => this.formatCurrency(Number(value)),
            },
          },
        },
        animation: { duration: 800, easing: 'easeInOutQuart' },
      },
    });
  }

  showBothMetrics(): void {
    if (!this.chart) return;
    this.chart.data.datasets[0].hidden = false;
    this.chart.data.datasets[1].hidden = false;
    // @ts-ignore
    this.chart.options.scales.y.display = true;
    // @ts-ignore
    this.chart.options.scales.y1.display = true;
    this.chart.update();
  }

  showCountOnly(): void {
    if (!this.chart) return;
    this.chart.data.datasets[0].hidden = false;
    this.chart.data.datasets[1].hidden = true;
    // @ts-ignore
    this.chart.options.scales.y.display = true;
    // @ts-ignore
    this.chart.options.scales.y1.display = false;
    this.chart.update();
  }

  showAmountOnly(): void {
    if (!this.chart) return;
    this.chart.data.datasets[0].hidden = true;
    this.chart.data.datasets[1].hidden = false;
    // @ts-ignore
    this.chart.options.scales.y.display = false;
    // @ts-ignore
    this.chart.options.scales.y1.display = true;
    // @ts-ignore
    this.chart.options.scales.y1.position = 'left';
    this.chart.update();
  }

  updateStats(): void {
    if (!Array.isArray(this.data) || this.data.length === 0) {
      this.totalTransactions = 0;
      this.totalAmount = this.formatCurrency(0);
      this.avgTransactions = 0;
      this.avgAmount = this.formatCurrency(0);
      return;
    }

    const totalTransactions = this.data.reduce((sum: number, item: any) => sum + (item.count ?? 0), 0);
    const totalAmountRaw = this.data.reduce((sum: number, item: any) => sum + (item.totalAmount ?? 0), 0);
    const avgTransactions = Math.round(totalTransactions / this.data.length);
    const avgAmountRaw = Math.round(totalAmountRaw / this.data.length);

    this.totalTransactions = totalTransactions;
    this.totalAmount = this.formatCurrency(totalAmountRaw);
    this.avgTransactions = avgTransactions;
    this.avgAmount = this.formatCurrency(avgAmountRaw);
  }
}
