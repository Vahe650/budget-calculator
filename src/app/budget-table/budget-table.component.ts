import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';
import {MatButtonModule} from "@angular/material/button";
import {Router} from "@angular/router";

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

    constructor(private apiService: ApiService,
                private router: Router) {}

    ngOnInit(): void {
        this.loadBudgets();
    }

    loadBudgets(): void {
        this.apiService.getAllBudgets().subscribe({
            next: (res) => {
                console.log('Budgets from backend:', res);
                this.budgets = res || [];
            },
            error: (err) => {
                console.error('Error fetching budgets:', err);
            }
        });
    }

    /** Called when user clicks Delete. Adjust logic as needed. */
    deleteBudget(budgetId: number): void {
        console.log('Deleting budget with ID:', budgetId);

        this.apiService.deleteBudget(budgetId).subscribe({
          next: (resp) => {
            console.log('Budget deleted:', resp);
            this.loadBudgets();
          },
          error: (err) => console.error('Error deleting budget:', err)
        });
    }

    goToCategories() {
        this.router.navigate(['/']);
    }

    /** Called when user clicks Edit. Adjust logic or navigate to edit route. */
    editBudget(budgetId: number): void {
        console.log('Editing budget with ID:', budgetId);
        // TODO: edit part
    }
}
