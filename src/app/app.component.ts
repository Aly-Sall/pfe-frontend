import { Component } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  pageTitle: string = 'Dashboard';

  constructor(private router: Router) {
    // Correction du typage de l'événement
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: Event) => {
        // Vérification et cast explicite
        if (event instanceof NavigationEnd) {
          // Logique pour définir le titre en fonction de l'URL
          if (event.url.includes('/tests')) {
            this.pageTitle = 'Tests';
          } else if (event.url.includes('/candidates')) {
            this.pageTitle = 'Candidates';
          } else if (event.url.includes('/analytics')) {
            this.pageTitle = 'Analytics';
          } else if (event.url.includes('/settings')) {
            this.pageTitle = 'Settings';
          } else {
            this.pageTitle = 'Dashboard';
          }
        }
      });
  }
}
