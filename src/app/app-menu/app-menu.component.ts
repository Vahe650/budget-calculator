import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from "@angular/material/button";
import {Router} from "@angular/router";

@Component({
  selector: 'app-app-menu',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.css']
})
export class AppMenuComponent {

  constructor(private router: Router,
  ) {
  }


  goToAddCategory(): void {
    this.router.navigate(['/add-category']);
  }

  goToBudgets(): void {
    this.router.navigate(['/budgets']);
  }

  goToCategories(): void {
    this.router.navigate(['/']);
  }

  isActive(path: string) : boolean {
    return this.router.url === path;
  }

}
