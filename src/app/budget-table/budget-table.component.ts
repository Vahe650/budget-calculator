import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from "@angular/material/button";
import {Router} from "@angular/router";
import {BudgetService} from "../service/budget.service";

/** Match the shape of BudgetShortDto returned by the backend. */
interface BudgetShortDto {
  id: number;
  year: number;
  createdAt: string;
  updatedAt: string;
  name: string;
}

@Component({
  selector: 'app-budget-table',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './budget-table.component.html',
  styleUrls: ['./budget-table.component.css']
})
export class BudgetTableComponent implements OnInit {

  /** Store the array of budgets here. */
  budgets: BudgetShortDto[] = [];

  constructor(private budgetService: BudgetService,
              private router: Router) {
  }

  ngOnInit(): void {
    this.loadBudgets();
  }

  loadBudgets(): void {
    this.budgetService.getAllBudgets().subscribe({
      next: (res) => {
        console.log('Budgets from backend:', res);
        this.budgets = res.content || [];
      },
      error: (err) => {
        console.error('Error fetching budgets:', err);
      }
    });
  }

  /** Called when user clicks Delete. Adjust logic as needed. */
  deleteBudget(budgetId: number): void {
    console.log('Deleting budget with ID:', budgetId);

    this.budgetService.deleteBudget(budgetId).subscribe({
      next: (resp) => {
        console.log('Budget deleted:', resp);
        this.loadBudgets();
      },
      error: (err) => console.error('Error deleting budget:', err)
    });
  }

  goToCategories(id: number, name: string) {
    this.router.navigate(['budgets/' + id + '/categories/'+name]);
  }

  /** Called when user clicks Edit. Adjust logic or navigate to edit route. */
  editBudget(budgetId: number): void {
    this.router.navigate(['add-budget/', budgetId]);
  }
}
