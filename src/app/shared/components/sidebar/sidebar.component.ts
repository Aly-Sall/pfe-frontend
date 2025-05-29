// sidebar.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  menuItems = [
    {
      title: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
    },
    {
      title: 'Tests',
      icon: 'assignment',
      route: '/tests',
    },
    {
      title: 'Questions',
      icon: 'quiz',
      route: '/questions',
    },
    {
      title: 'Candidates',
      icon: 'people',
      route: '/candidates',
    },
    {
      title: 'Analytics',
      icon: 'insights',
      route: '/analytics',
    },
    {
      title: 'Settings',
      icon: 'settings',
      route: '/settings',
    },
  ];

  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
