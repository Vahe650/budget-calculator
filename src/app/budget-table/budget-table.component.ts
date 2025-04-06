import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api.service';

/** Match the shape of BudgetShortDto returned by the backend. */
interface BudgetShortDto {
    id: number;
    year: number;
    createdAt: string;   // "dd.MM.yyyy" format from your backend
    updatedAt: string;   // "dd.MM.yyyy"
    name: string;
}

@Component({
    selector: 'app-budget-table',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './budget-table.component.html',
    styleUrls: ['./budget-table.component.css']
})
export class BudgetTableComponent implements OnInit {

    /** Store the array of budgets here. */
    budgets: BudgetShortDto[] = [];

    constructor(private apiService: ApiService) {}

    ngOnInit(): void {
        this.loadBudgets();
    }

    loadBudgets(): void {
        this.apiService.getAllBudgets().subscribe({
            next: (res) => {
                console.log('Budgets from backend:', res);
                // res should be an array of BudgetShortDto
                this.budgets = res || []; // if it's an array, directly assign
            },
            error: (err) => {
                console.error('Error fetching budgets:', err);
            }
        });
    }

    /** Called when user clicks Delete. Adjust logic as needed. */
    deleteBudget(budgetId: number): void {
        // TODO: Confirm or do actual delete
        console.log('Deleting budget with ID:', budgetId);

        // Example call:
        // this.apiService.deleteBudget(budgetId).subscribe({
        //   next: (resp) => {
        //     console.log('Budget deleted:', resp);
        //     this.loadBudgets();
        //   },
        //   error: (err) => console.error('Error deleting budget:', err)
        // });
    }

    /** Called when user clicks Edit. Adjust logic or navigate to edit route. */
    editBudget(budgetId: number): void {
        console.log('Editing budget with ID:', budgetId);
        // TODO: navigate to some edit page or open a form
        // this.router.navigate(['/edit-budget', budgetId]);
    }
}
