import { Component, OnInit } from '@angular/core';

export interface Test {
  id: number;
  name: string;
  category: string;
  status: 'Active' | 'Completed';
  candidates: number;
}

@Component({
  selector: 'app-tests',
  templateUrl: './tests.component.html',
  styleUrls: ['./tests.component.scss'],
})
export class TestsComponent implements OnInit {
  tests: Test[] = [
    {
      id: 1,
      name: 'Technical Assessment',
      category: 'Frontend Development',
      status: 'Active',
      candidates: 245,
    },
    {
      id: 2,
      name: 'Coding Challenge',
      category: 'Backend Development',
      status: 'Active',
      candidates: 178,
    },
    {
      id: 3,
      name: 'Aptitude Test',
      category: 'General Assessment',
      status: 'Completed',
      candidates: 312,
    },
  ];
  isLoading: boolean = false;

  // Ajoutez cette propriété
  showCreateForm: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.loadTests();
  }

  loadTests(): void {
    this.isLoading = true;

    // Simule un délai d'API (à supprimer lors de l'implémentation réelle)
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  // Ajoutez cette méthode
  createNewTest(): void {
    this.showCreateForm = true;
  }

  // Ajoutez cette méthode
  handleCancelCreate(): void {
    this.showCreateForm = false;
  }

  // Ajoutez cette méthode
  handleCreateTest(testData: any): void {
    console.log('Creating test with data:', testData);

    // Simuler l'ajout d'un nouveau test
    const newTest: Test = {
      id: this.tests.length + 1,
      name: testData.testName,
      category: testData.testType,
      status: 'Active',
      candidates: 0,
    };

    this.tests.unshift(newTest);
    this.showCreateForm = false;
  }

  editTest(test: Test): void {
    console.log('Editing test:', test);
    // Implémentez la logique pour éditer un test
  }

  deleteTest(test: Test): void {
    console.log('Deleting test:', test);
    // Implémentez la logique pour supprimer un test
  }

  get filteredTests(): Test[] {
    return this.tests;
  }
}
