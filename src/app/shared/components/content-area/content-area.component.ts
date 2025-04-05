// content-area.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-content-area',
  templateUrl: './content-area.component.html',
  styleUrls: ['./content-area.component.scss'],
})
export class ContentAreaComponent {
  @Input() pageTitle: string = '';
}
