import { Component, OnInit } from '@angular/core';
import { OperationsPanelService } from '../../services/operations-panel.service';

@Component({
  selector: 'app-operations-panel',
  templateUrl: './operations-panel.component.html',
  styleUrls: ['./operations-panel.component.scss']
})
export class OperationsPanelComponent implements OnInit {
  statusMessage: string = '';
  loading: boolean = false;
  servicesHealth: any[] = [];
  healthLoading: boolean = false;

  constructor(private opsService: OperationsPanelService) {}

  ngOnInit() {
    this.fetchServicesHealth();
  }

  fetchServicesHealth() {
    this.healthLoading = true;
    this.opsService.getAllServicesHealth().subscribe({
      next: (data) => {
        this.servicesHealth = data;
        this.healthLoading = false;
      },
      error: () => {
        this.servicesHealth = [];
        this.healthLoading = false;
      }
    });
  }

  restartBackend() {
    this.loading = true;
    this.statusMessage = 'Restarting backend...';
    this.opsService.restartService().subscribe({
      next: () => {
        this.statusMessage = 'Backend restarted successfully.';
        this.loading = false;
      },
      error: (err) => {
        this.statusMessage = 'Failed to restart backend.';
        this.loading = false;
      }
    });
  }

  shutdownBackend() {
    this.loading = true;
    this.statusMessage = 'Shutting down backend...';
    this.opsService.shutdownService().subscribe({
      next: () => {
        this.statusMessage = 'Backend shutdown command sent.';
        this.loading = false;
      },
      error: (err) => {
        this.statusMessage = 'Failed to shutdown backend.';
        this.loading = false;
      }
    });
  }
}
