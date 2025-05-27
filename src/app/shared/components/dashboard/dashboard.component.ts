import { Component, OnInit } from '@angular/core';
import {
  DashboardService,
  DashboardStats,
} from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalCandidates: 0,
    activeTests: 0,
    averageScore: 0,
    recentTests: [],
  };

  isLoading: boolean = true;
  error: string | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(
          'Erreur lors du chargement des données du tableau de bord',
          error
        );
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
      },
    });
  }

  // Getters pour la compatibilité avec le template existant
  get totalCandidates(): number {
    return this.stats.totalCandidates;
  }

  get activeTests(): number {
    return this.stats.activeTests;
  }

  get averageScore(): number {
    return this.stats.averageScore;
  }

  get recentTests(): any[] {
    return this.stats.recentTests;
  }
}
