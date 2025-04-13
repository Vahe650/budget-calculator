import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {CategoryService} from '../service/category.service';
import {FormsModule} from '@angular/forms';
import {CategoryDescription} from "../model/CategoryDescription";

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
  categoryDescriptions: CategoryDescription[] = [
    CategoryDescription.DEPRECIATION,
    CategoryDescription.TAX,
    CategoryDescription.INCOME,
    CategoryDescription.AMORTIZATIONS,
    CategoryDescription.EXPENSES,
    CategoryDescription.INTEREST,

  ];

  newCategory: {
    name: string;
    nestedLevel: string;
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
    categoryDescription: CategoryDescription | null;
    budgetId: number | null;
    parentId: number | null;
    /** The “value types” for the category, e.g. MONEY, WEIGHT, etc. */
    valueType: string[];
    toAllMonths: boolean;
    taxDisable: boolean;
  } = {
    name: '',
    nestedLevel: '0',
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
    categoryDescription: null,
    budgetId: null,
    parentId: null,
    valueType: [],
    toAllMonths: true,
    taxDisable: false,
  };

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private activatedRoute: ActivatedRoute,
  ) {
  }

  /**
   * On component init, load all budgets and categories to display
   * in the <select> dropdowns for “Budget” and “Parent” fields.
   */
  ngOnInit(): void {

  }

  /**
   * User clicks “Save” => build category data => call createCategory => navigate
   */
  saveCategory() {
    this.activatedRoute.params.subscribe(params => {
      if (params['id']) {
        this.newCategory.budgetId = params['id'];
      }
      const categoryData
        = {
        ...this.newCategory,
        unitPrice: this.generateUnitPrices(),
        isAutocomplete: false,
        taxRate: this.newCategory.taxRate === 0 ? null : this.newCategory.taxRate,
      };

      this.categoryService.createCategory(categoryData).subscribe({
        next: (response) => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error creating category:', err);
        }
      });
    })
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

  getCategories(event: any) {
    var categories = null;
    if (this.newCategory.nestedLevel === '1') {
      categories = this.categoryService.getCategoriesByNestingLevel(0, '');
    }
    if (this.newCategory.nestedLevel === '2') {
      categories = this.categoryService.getCategoriesByNestingLevel(1, '');
    }
    if (categories) {
      categories.subscribe({
        next: (res) => {
          this.categories = res || [];
        },
        error: (err) => {
          console.error('Error loading categories:', err);
        }
      });
    }
  }

  disableUnitType(unit1: boolean, unit2:boolean): boolean {
    return unit1|| unit2
  }

  addValueForAllMonths(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.newCategory.jan = value;
    this.newCategory.feb = value;
    this.newCategory.mar = value;
    this.newCategory.apr = value;
    this.newCategory.may = value;
    this.newCategory.jun = value;
    this.newCategory.jul = value;
    this.newCategory.aug = value;
    this.newCategory.sep = value;
    this.newCategory.oct = value;
    this.newCategory.nov = value;
    this.newCategory.dec = value;
  }

  disableTaxAndSetNUll() {
    this.newCategory.taxRate = 0;
    this.newCategory.taxDisable = !this.newCategory.taxDisable
  }


  isFormValid(): boolean {
    if (this.newCategory.nestedLevel === '0') {
      return this.newCategory.name !== '' && this.newCategory.categoryDescription !== null
    }
    if (this.newCategory.nestedLevel === '1') {
      return this.newCategory.name !== '' && this.newCategory.parentId !== null
    }
    if (this.newCategory.nestedLevel === '2') {
      return this.newCategory.name !== '' && this.newCategory.parentId !== null
        && (this.newCategory.unitMoney && (this.newCategory.unitTons || this.newCategory.unitLiters || this.newCategory.unitPieces))
      && this.newCategory.jan !== 0
    }
    return false;
  }
}
