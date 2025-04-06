import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CategoryTableComponent} from "./category-table/category-table.component";
import {RouterOutlet} from "@angular/router";
import {BudgetTableComponent} from "./budget-table/budget-table.component";
import {AppMenuComponent} from "./app-menu/app-menu.component";

@Component({
    selector: 'app-root',
  imports: [CommonModule, CategoryTableComponent, RouterOutlet, BudgetTableComponent, AppMenuComponent],
    templateUrl: './app.component.html',
    standalone: true,
    styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'budget-calculator';
}
