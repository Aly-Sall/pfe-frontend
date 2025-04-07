import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { forkJoin } from 'rxjs';

interface TestDisplay {
  name: string;
  candidates: number;
  status: 'Active' | 'Completed';
  averageScore: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  totalCandidates: number = 0;
  activeTests: number = 0;
  averageScore: number = 0;

  recentTests: TestDisplay[] = [];
  isLoading: boolean = true;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    // Utilisation de forkJoin pour combiner plusieurs observables
    forkJoin({
      candidates: this.dashboardService.getNombreCandidats(),
      activeTests: this.dashboardService.getNombreTestsActifs(),
      averageScore: this.dashboardService.getScoreMoyen(),
      recentTests: this.dashboardService.getTestsRecents(),
    }).subscribe({
      next: (data) => {
        this.totalCandidates = data.candidates;
        this.activeTests = data.activeTests;
        this.averageScore = data.averageScore;
        this.recentTests = data.recentTests;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(
          'Erreur lors du chargement des données du tableau de bord',
          error
        );
        this.isLoading = false;
      },
    });
  }
}
