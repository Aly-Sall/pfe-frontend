// src/app/shared/components/tests/tests.component.ts - Version corrigée avec Update et Delete
import { Component, OnInit } from '@angular/core';
import {
  TestService,
  TestDto,
  CreateTestCommand,
} from '../../../core/services/test.service';

@Component({
  selector: 'app-tests',
  templateUrl: './tests.component.html',
  styleUrls: ['./tests.component.scss'],
})
export class TestsComponent implements OnInit {
  tests: TestDto[] = [];
  isLoading: boolean = false;
  showCreateForm: boolean = false;
  showDetailView: boolean = false;
  selectedTest: TestDto | null = null;
  testToEdit: TestDto | null = null;
  error: string | null = null;

  constructor(private testService: TestService) {}

  ngOnInit(): void {
    this.loadTests();
  }

  // Charger tous les tests depuis l'API
  loadTests(): void {
    this.isLoading = true;
    this.error = null;

    this.testService.getAllTests().subscribe({
      next: (tests) => {
        this.tests = tests;
        this.isLoading = false;
        console.log('Tests loaded successfully:', tests);
      },
      error: (error) => {
        console.error('Error loading tests:', error);
        this.error = 'Erreur lors du chargement des tests';
        this.isLoading = false;
        // En cas d'erreur, utiliser des données de démonstration
        this.loadMockData();
      },
    });
  }

  // Données de démonstration en cas d'erreur API
  private loadMockData(): void {
    this.tests = [
      {
        id: 1,
        title: 'Technical Assessment',
        category: 1,
        mode: 0,
        isActive: true,
        showTimer: true,
        tryAgain: false,
        level: 0,
      },
      {
        id: 2,
        title: 'Coding Challenge',
        category: 2,
        mode: 0,
        isActive: true,
        showTimer: true,
        tryAgain: true,
        level: 1,
      },
      {
        id: 3,
        title: 'Aptitude Test',
        category: 1,
        mode: 0,
        isActive: false,
        showTimer: false,
        tryAgain: false,
        level: 2,
      },
    ];
  }

  // Afficher les détails d'un test
  viewTestDetails(test: TestDto): void {
    this.selectedTest = test;
    this.showDetailView = true;
    this.showCreateForm = false;
  }

  // Créer un nouveau test
  createNewTest(): void {
    this.testToEdit = null;
    this.showCreateForm = true;
    this.showDetailView = false;
  }

  // Éditer un test existant
  editTest(test: TestDto): void {
    this.testToEdit = test;
    this.showCreateForm = true;
    this.showDetailView = false;
  }

  // Gérer l'annulation de création/édition
  handleCancelCreate(): void {
    this.showCreateForm = false;
    this.testToEdit = null;
  }

  // Gérer la création d'un test avec l'API
  handleCreateTest(createCommand: CreateTestCommand): void {
    console.log('Creating test with command:', createCommand);

    this.isLoading = true;
    this.error = null;

    // Appeler directement le service avec la commande reçue
    this.testService.createTest(createCommand).subscribe({
      next: (response) => {
        console.log('Test created successfully:', response);

        if (response.isSuccess && response.id) {
          // Créer un TestDto pour l'affichage local
          const createdTest: TestDto = {
            id: response.id,
            title: createCommand.title,
            category: createCommand.category,
            mode: createCommand.mode,
            level: createCommand.level,
            tryAgain: createCommand.tryAgain,
            showTimer: createCommand.showTimer,
            isActive: true,
          };

          // Ajouter le nouveau test à la liste locale
          this.tests.unshift(createdTest);
          this.showCreateForm = false;
          this.testToEdit = null;
          this.error = null;

          console.log('Test added to local list:', createdTest);
        } else {
          this.error = response.error || 'Erreur lors de la création du test';
          console.error('Create test failed:', response.error);
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating test:', error);
        this.error =
          'Erreur lors de la création du test: ' +
          (error.message || 'Erreur inconnue');
        this.isLoading = false;
      },
    });
  }

  // ✅ CORRIGÉ: Gérer la mise à jour d'un test avec l'API
  handleUpdateTest(updatedTest: TestDto): void {
    console.log('Updating test:', updatedTest);

    if (!updatedTest.id) {
      this.error = 'Impossible de mettre à jour le test: ID manquant';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.testService.updateTest(updatedTest).subscribe({
      next: () => {
        console.log('Test updated successfully');

        // Mettre à jour le test dans la liste locale
        const index = this.tests.findIndex((t) => t.id === updatedTest.id);
        if (index !== -1) {
          this.tests[index] = updatedTest;
        }

        // Mettre à jour le test sélectionné si c'est le même
        if (this.selectedTest?.id === updatedTest.id) {
          this.selectedTest = updatedTest;
        }

        this.showCreateForm = false;
        this.testToEdit = null;
        this.error = null;
        this.isLoading = false;

        // Afficher un message de succès
        console.log('Test mis à jour avec succès');
      },
      error: (error) => {
        console.error('Error updating test:', error);
        this.error =
          'Erreur lors de la mise à jour du test: ' +
          (error.message || 'Erreur inconnue');
        this.isLoading = false;
      },
    });
  }

  // Gérer la mise à jour d'un test depuis la vue détaillée
  handleTestUpdate(updatedTest: TestDto): void {
    this.handleUpdateTest(updatedTest);
  }

  // ✅ CORRIGÉ: Supprimer un test avec l'API
  deleteTest(test: TestDto): void {
    if (!test.id) {
      this.error = 'Impossible de supprimer le test: ID manquant';
      return;
    }

    const confirmMessage = test.isActive
      ? `Attention: Le test "${test.title}" est actuellement actif. Êtes-vous sûr de vouloir le supprimer ?`
      : `Êtes-vous sûr de vouloir supprimer le test "${test.title}" ?`;

    if (confirm(confirmMessage)) {
      this.isLoading = true;
      this.error = null;

      this.testService.deleteTest(test.id).subscribe({
        next: () => {
          console.log('Test deleted successfully');

          // Supprimer le test de la liste locale
          this.tests = this.tests.filter((t) => t.id !== test.id);

          // Fermer la vue détaillée si c'est le test supprimé
          if (this.selectedTest?.id === test.id) {
            this.selectedTest = null;
            this.showDetailView = false;
          }

          this.error = null;
          this.isLoading = false;

          // Afficher un message de succès
          console.log('Test supprimé avec succès');
        },
        error: (error) => {
          console.error('Error deleting test:', error);

          // Gestion des erreurs spécifiques
          let errorMessage = 'Erreur lors de la suppression du test: ';

          if (error.message.includes('Forbidden')) {
            errorMessage +=
              "Impossible de supprimer un test actif. Désactivez-le d'abord.";
          } else if (error.message.includes('not found')) {
            errorMessage += "Le test n'existe plus.";
          } else {
            errorMessage += error.message || 'Erreur inconnue';
          }

          this.error = errorMessage;
          this.isLoading = false;
        },
      });
    }
  }

  // ✅ NOUVEAU: Activer/Désactiver un test
  toggleTestStatus(test: TestDto): void {
    if (!test.id) {
      this.error = 'Impossible de modifier le statut: ID manquant';
      return;
    }

    const newStatus = !test.isActive;
    const action = newStatus ? 'activer' : 'désactiver';

    if (confirm(`Voulez-vous ${action} le test "${test.title}" ?`)) {
      this.isLoading = true;
      this.error = null;

      // Créer une copie mise à jour du test
      const updatedTest: TestDto = {
        ...test,
        isActive: newStatus,
      };

      this.testService.updateTest(updatedTest).subscribe({
        next: () => {
          console.log(`Test ${action} successfully`);

          // Mettre à jour le test dans la liste locale
          const index = this.tests.findIndex((t) => t.id === test.id);
          if (index !== -1) {
            this.tests[index] = updatedTest;
          }

          // Mettre à jour le test sélectionné si c'est le même
          if (this.selectedTest?.id === test.id) {
            this.selectedTest = updatedTest;
          }

          this.error = null;
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error ${action} test:`, error);
          this.error = `Erreur lors de la modification du statut: ${
            error.message || 'Erreur inconnue'
          }`;
          this.isLoading = false;
        },
      });
    }
  }

  // Actualiser la liste des tests
  refreshTests(): void {
    this.loadTests();
  }

  // Convertir la catégorie en libellé
  getCategoryLabel(category: number): string {
    switch (category) {
      case 0:
        return 'None';
      case 1:
        return 'General';
      case 2:
        return 'Technical';
      default:
        return 'Unknown';
    }
  }

  // Convertir le niveau en libellé
  getLevelLabel(level: number): string {
    switch (level) {
      case 0:
        return 'Easy';
      case 1:
        return 'Medium';
      case 2:
        return 'Hard';
      default:
        return 'Unknown';
    }
  }

  // Convertir le mode en libellé
  getModeLabel(mode: number): string {
    switch (mode) {
      case 0:
        return 'Training';
      case 1:
        return 'Recruitment';
      default:
        return 'Unknown';
    }
  }

  get filteredTests(): TestDto[] {
    return this.tests;
  }

  // Optimisation des performances pour ngFor
  trackByTestId(index: number, test: TestDto): number {
    return test.id || index;
  }

  // ✅ NOUVEAU: Vérifier si un test peut être supprimé
  canDeleteTest(test: TestDto): boolean {
    // On peut supprimer un test s'il n'est pas actif
    // Ou selon les règles métier de votre application
    return !test.isActive;
  }

  // ✅ NOUVEAU: Vérifier si un test peut être modifié
  canEditTest(test: TestDto): boolean {
    // On peut modifier un test s'il n'est pas actif
    // Ou selon les règles métier de votre application
    return !test.isActive;
  }
}
