import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {ApiService} from '../api.service';
import {FormsModule} from '@angular/forms';

@Component({
    selector: 'app-add-category',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './add-category.component.html',
    styleUrls: ['./add-category.component.css']
})
export class AddCategoryComponent implements OnInit {

    /** Arrays to store all budgets and categories fetched from the backend */
    budgets: any[] = [];
    categories: any[] = [];

    newCategory: {
        name: string;
        type: string;
        unitType: string;
        taxRate: number;
        jan: number;
        feb: number;
        mar: number;
        apr: number;
        may: number;
        jun: number;
        jul: number;
        aug: number;
        sep: number;
        oct: number;
        nov: number;
        dec: number;
        total: number;
        unitMoney: boolean;
        unitTons: boolean;
        unitPieces: boolean;
        unitLiters: boolean;
        priceChange: boolean;
        expandable: boolean;
        expanded: boolean;
        /**
         * Budget and parent IDs
         * We will map them from dropdowns to the actual ID, but show names
         */
        budgetId: number | null;
        parentId: number | null;
        /** The “value types” for the category, e.g. MONEY, WEIGHT, etc. */
        valueType: string[];
    } = {
        name: '',
        type: 'revenue',
        unitType: 'money',
        taxRate: 0,
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0,
        jun: 0, jul: 0, aug: 0, sep: 0, oct: 0,
        nov: 0, dec: 0,
        total: 0,
        unitMoney: false,
        unitTons: false,
        unitPieces: false,
        unitLiters: false,
        priceChange: false,
        expandable: false,
        expanded: false,
        budgetId: null,
        parentId: null,
        valueType: []
    };

    constructor(
        private router: Router,
        private budgetService: ApiService
    ) {
    }

    /**
     * On component init, load all budgets and categories to display
     * in the <select> dropdowns for “Budget” and “Parent” fields.
     */
    ngOnInit(): void {
        this.budgetService.getAllBudgets().subscribe({
            next: (res) => {
                console.log('Budgets resp:', res);
                this.budgets = res || [];
            },
            error: (err) => {
                console.error('Error loading budgets:', err);
            }
        });

        // Also fetch categories if needed
        this.budgetService.getAllCategories().subscribe({
            next: (res) => {
                console.log('Categories resp:', res);
                this.categories = res || [];
            },
            error: (err) => {
                console.error('Error loading categories:', err);
            }
        });

        console.log('Budgets:', this.budgets);
        console.log('Categories:', this.categories);
    }

    /**
     * User clicks “Save” => build category data => call createCategory => navigate
     */
    saveCategory() {
        const categoryData = {
            ...this.newCategory,
            unitPrice: this.generateUnitPrices(),
            isAutocomplete: false,
            categoryDescription: 'REVENUE'
        };

        this.budgetService.createCategory(categoryData).subscribe({
            next: (response) => {
                console.log('Category created:', response);
                this.router.navigate(['/']);
            },
            error: (err) => {
                console.error('Error creating category:', err);
            }
        });
    }

    cancel() {
        this.router.navigate(['/']);
    }

    /**
     * Maps selected unit checkboxes to the ValueType enum(s) for the backend
     */
    mapUnitToValueType() {
        const valueType: string[] = [];
        if (this.newCategory.unitMoney) valueType.push('MONEY');
        if (this.newCategory.unitTons) valueType.push('WEIGHT');
        if (this.newCategory.unitLiters) valueType.push('LITERS');
        if (this.newCategory.unitPieces) valueType.push('PIECES');
        this.newCategory.valueType = valueType;
    }

    /**
     * Convert the monthly fields (jan, feb, etc.) into the format
     * the backend expects, e.g. [{month: 'JANUARY', value: 123}, ...]
     */
    generateUnitPrices() {
        const monthMap: { [key: string]: string } = {
            jan: 'JANUARY',
            feb: 'FEBRUARY',
            mar: 'MARCH',
            apr: 'APRIL',
            may: 'MAY',
            jun: 'JUNE',
            jul: 'JULY',
            aug: 'AUGUST',
            sep: 'SEPTEMBER',
            oct: 'OCTOBER',
            nov: 'NOVEMBER',
            dec: 'DECEMBER'
        };

        const months: (keyof typeof this.newCategory)[] = [
            'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
        ];

        return months.map((month) => {
            return {
                month: monthMap[month],
                value: this.newCategory[month]
            };
        });
    }
}
