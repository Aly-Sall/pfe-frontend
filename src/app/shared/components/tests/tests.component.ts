import { Component, OnInit } from '@angular/core';
import { TestService, TestDto } from '../../../core/services/test.service';

@Component({
  selector: 'app-tests',
  templateUrl: './tests.component.html',
  styleUrls: ['./tests.component.scss'],
})
export class TestsComponent implements OnInit {
  tests: TestDto[] = [
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
  isLoading: boolean = false;
  showCreateForm: boolean = false;
  showDetailView: boolean = false;
  selectedTest: TestDto | null = null;
  testToEdit: TestDto | null = null;

  constructor(private testService: TestService) {}

  ngOnInit(): void {
    this.loadTests();
  }

  loadTests(): void {
    this.isLoading = true;

    // Simuler le chargement depuis l'API
    setTimeout(() => {
      // Dans une implémentation réelle, vous appelleriez votre service ici
      // this.testService.getAllTests().subscribe(...)
      this.isLoading = false;
    }, 500);
  }

  // Afficher les détails d'un test
  viewTestDetails(test: TestDto): void {
    this.selectedTest = test;
    this.showDetailView = true;
    this.showCreateForm = false;
  }

  // Créer un nouveau test
  createNewTest(): void {
    this.testToEdit = null; // S'assurer qu'on n'est pas en mode édition
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

  // Gérer la création d'un test
  handleCreateTest(testData: any): void {
    console.log('Creating test with data:', testData);

    // Dans une implémentation réelle, vous appelleriez votre service ici
    // this.testService.createTest(newTest).subscribe(...)

    // Simuler l'ajout d'un nouveau test
    const newTest: TestDto = {
      id: this.tests.length + 1,
      title: testData.testName,
      category: this.getCategoryFromType(testData.testType),
      mode: 0,
      isActive: true,
      showTimer: true,
      tryAgain: testData.settings?.allowMultipleAttempts || false,
      level: 0,
    };

    this.tests.unshift(newTest);
    this.showCreateForm = false;
    this.testToEdit = null;
  }

  // Gérer la mise à jour d'un test
  handleUpdateTest(updatedTest: TestDto): void {
    console.log('Updating test:', updatedTest);

    // Dans une implémentation réelle, vous appelleriez votre service ici
    // this.testService.updateTest(updatedTest).subscribe(...)

    // Simuler la mise à jour dans la liste locale
    const index = this.tests.findIndex((t) => t.id === updatedTest.id);
    if (index !== -1) {
      this.tests[index] = updatedTest;
    }

    this.showCreateForm = false;
    this.testToEdit = null;
  }

  // Gérer la mise à jour d'un test depuis la vue détaillée
  handleTestUpdate(updatedTest: TestDto): void {
    // Mise à jour du test dans la liste locale
    const index = this.tests.findIndex((t) => t.id === updatedTest.id);
    if (index !== -1) {
      this.tests[index] = updatedTest;
    }

    // Mettre à jour le test sélectionné
    this.selectedTest = updatedTest;
  }

  // Supprimer un test
  deleteTest(test: TestDto): void {
    console.log('Deleting test:', test);

    if (confirm('Are you sure you want to delete this test?')) {
      // Dans une implémentation réelle, vous appelleriez votre service ici
      // this.testService.deleteTest(test.id).subscribe(...)

      // Simuler la suppression
      this.tests = this.tests.filter((t) => t.id !== test.id);
    }
  }

  // Convertir le type de test en catégorie
  getCategoryFromType(type: string): number {
    switch (type) {
      case 'Technical Assessment':
        return 1;
      case 'Coding Challenge':
        return 2;
      case 'Aptitude Test':
        return 1;
      case 'Behavioral Assessment':
        return 2;
      default:
        return 0;
    }
  }

  get filteredTests(): TestDto[] {
    return this.tests;
  }
}
