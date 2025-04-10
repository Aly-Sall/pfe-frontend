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

  createNewTest(): void {
    console.log('Creating new test');
    // Implémentez la logique pour créer un nouveau test
  }

  editTest(test: Test): void {
    console.log('Editing test:', test);
    // Implémentez la logique pour éditer un test
  }

  deleteTest(test: Test): void {
    console.log('Deleting test:', test);
    // Implémentez la logique pour supprimer un test
  }

  // Comme nous n'avons plus de recherche, nous pouvons simplement utiliser les tests directement
  get filteredTests(): Test[] {
    return this.tests;
  }
}
