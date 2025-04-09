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

  goToCategories(id: number) {
    this.router.navigate(['/categories/' + id]);
  }

  goToAddCategory(): void {
    var data = this.router.url.split('/');
    var budgetId = data[2];
    this.router.navigate(['/add-category/' + budgetId]);
  }

  goToAddBudgets(): void {
    this.router.navigate(['/add-budget']);
  }

  goToBudgets(): void {
    this.router.navigate(['/']);
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

}
