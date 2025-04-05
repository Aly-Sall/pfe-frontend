// navbar.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  @Input() pageTitle: string = 'Dashboard';

  // User info qui pourrait venir d'un service d'authentification
  userInfo = {
    name: 'John Doe',
    avatar: 'assets/images/avatar.jpg',
  };

  // Pour la fonctionnalité de recherche
  searchQuery: string = '';

  search(): void {
    console.log('Searching for:', this.searchQuery);
    // Logique de recherche ici
  }
}
