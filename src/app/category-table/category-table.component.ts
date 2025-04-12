import {Component, HostListener, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';

import {CategoryService} from '../service/category.service';
import {Categ, Cell, FinancialCell, Price} from "../model/Price";
import {ActivatedRoute} from "@angular/router";
import {FormGroup} from "@angular/forms";
import {CategoryDescription} from "../model/CategoryDescription";


@Component({
  selector: 'app-budget-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
  ],
  templateUrl: './category-table.component.html',
  styleUrls: ['./category-table.component.css'],
})
export class CategoryTableComponent implements OnInit {

  displayedColumns = [
    'name', 'tax', 'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'total', 'delete', 'expand'
  ];

  months = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  ];

  // Tracks whether the input is focused
  isInputFocused = false;

  /** The top-level categories to display. */
  categories: Categ[] = [];
  categoryResponse: Categ[] = [];

  categoryWithMetrics: {} = {}

  budgetId: number = 0;
  budgetName: string = '';

  public dataSource: MatTableDataSource<Categ>;

  forms: Array<FormGroup> [] [] = [];


  constructor(
    private budgetService: CategoryService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.dataSource = new MatTableDataSource<Categ>([]);
  }

  ngOnInit(): void {
    this.getAllCategories()
  }

  getAllCategories() {
    this.activatedRoute.params.subscribe(params => {
      if (params['id']) {
        this.budgetId = params['id'];
        this.budgetName = params['name'];
        this.budgetService.getAllCategories(this.budgetId).subscribe({
          next: (response) => {
            this.categoryResponse = response as Categ[];
            const categoryDtos = response as Categ[];
            this.drawTable(categoryDtos);
          },
          error: (err) => {
            console.error('Error fetching categories:', err);
          },
        });
      }
    })

  }

  drawTable(categoryDtos: Categ[]) {
    this.categoryWithMetrics = categoryDtos.filter(c => c.financialResults.length > 0)[0] as Categ
    const categories = this.calculateCategoryAggregates(categoryDtos)

    // @ts-ignore
    categories[0].financialResults.sort(function (a, b) {
      if (a.financialMetricType && b.financialMetricType) {
        return a.financialMetricType.length < b.financialMetricType.length;
      }
      return 0;
    });
    this.categories = categories

    this.dataSource = new MatTableDataSource<Categ>(categories);
  }

  calculateCategoryAggregates(
    categories: Categ[],
    flatList: Categ[] = [],
    addEbit = true
  ): Categ[] {

    const monthOrder: Record<string, number> = {
      JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4,
      MAY: 5, JUNE: 6, JULY: 7, AUGUST: 8,
      SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
    };

    categories.forEach(category => {
      flatList.push(category);

      if (category.childCategories?.length) {
        this.calculateCategoryAggregates(category.childCategories, flatList, false);

        const priceMap = new Map<string, Price>();

        category.childCategories.forEach(child => {
          child.cells.forEach(cell => {
            if (!priceMap.has(cell.month)) {
              priceMap.set(cell.month, {priceInMoney: 0, pricePerUnit: 0, unitCount: 0});
            }
            const current = priceMap.get(cell.month)!;
            current.priceInMoney += cell.price.priceInMoney;
            current.pricePerUnit += cell.price.pricePerUnit;
            current.unitCount += cell.price.unitCount;
          });
        });

        const sortedCells = Array.from(priceMap.entries())
          .sort((a, b) => monthOrder[a[0]] - monthOrder[b[0]])
          .map(([month, price], idx) => ({
            id: idx + 1,
            month,
            price
          }));

        category.cells = sortedCells;
        category.totalAmount = {
          priceInMoney: category.cells.reduce(
            (sum, cell) => sum + cell.price.pricePerUnit,
            0
          ),
          unitCount: category.cells.reduce(
            (sum, cell) => sum + cell.price.unitCount,
            0
          ),
        };
      } else {
        category.cells.sort((a, b) => monthOrder[a.month] - monthOrder[b.month]);
        category.totalAmount = {
          priceInMoney: category.cells.reduce(
            (sum, cell) => sum + cell.price.pricePerUnit,
            0
          ),
          unitCount: category.cells.reduce(
            (sum, cell) => sum + cell.price.unitCount,
            0
          ),
        };
      }
    });

    // Add financial results categories for each financial metric (EBIT, EBITDA, NETTO_PELNA)
    if (addEbit) {
      const level0Categories = flatList.filter(c => c.nestingLevel === 0);
      if (level0Categories.length >= 1) {
        // Retrieve specific categories based on category description
        const income = level0Categories.find(c => c.categoryDescription === CategoryDescription.INCOME);
        const expenses = level0Categories.find(c => c.categoryDescription === CategoryDescription.EXPENSES);
        const amortizations = level0Categories.find(c => c.categoryDescription === CategoryDescription.AMORTIZATIONS);
        const depreciation = level0Categories.find(c => c.categoryDescription === CategoryDescription.DEPRECIATION);
        const tax = level0Categories.find(c => c.categoryDescription === CategoryDescription.TAX);
        const interest = level0Categories.find(c => c.categoryDescription === CategoryDescription.INTEREST);

        const financialResults = level0Categories.find(c => c.financialResults && c.financialResults.length > 0)?.financialResults;

        if (financialResults && financialResults.length) {
          financialResults.forEach(financialResult => {
            const metricType = financialResult.financialMetricType;
            let diffCells: Cell [] = [];
            let totalAmount = 0;
            let unitCount = 0;

            switch (metricType) {
              case 'EBITDA':
                // EBITDA = Income - Expenses
                if (income && expenses) {
                  diffCells = income.cells.map((cell, idx) => {
                    const correspondingExpense = expenses.cells.find(c => c.month === cell.month);
                    const fallback = {price: {priceInMoney: 0, pricePerUnit: 0, unitCount: 0}};

                    const expensePrice = correspondingExpense?.price || fallback.price;

                    return {
                      id: cell.id,
                      month: cell.month,
                      price: {
                        priceInMoney: cell.price.priceInMoney - expensePrice.priceInMoney,
                        pricePerUnit: cell.price.pricePerUnit - expensePrice.pricePerUnit,
                        unitCount: cell.price.unitCount - expensePrice.unitCount,
                      }
                    };
                  });

                  totalAmount = diffCells.reduce((sum, c) => sum + c.price.pricePerUnit, 0);
                  unitCount = diffCells.reduce((sum, c) => sum + c.price.unitCount, 0);
                }
                break;

              case 'EBIT':
                // EBIT = Income - Expenses - Amortizations - Depreciation
                if (income && expenses && amortizations && depreciation) {
                  diffCells = income.cells.map((cell, idx) => {
                    const correspondingExpense = expenses.cells.find(c => c.month === cell.month);
                    const correspondingAmortization = amortizations.cells.find(c => c.month === cell.month);
                    const correspondingDepreciation = depreciation.cells.find(c => c.month === cell.month);

                    const fallback = {price: {priceInMoney: 0, pricePerUnit: 0, unitCount: 0}};

                    const expensePrice = correspondingExpense?.price || fallback.price;
                    const amortizationPrice = correspondingAmortization?.price || fallback.price;
                    const depreciationPrice = correspondingDepreciation?.price || fallback.price;

                    return {
                      id: cell.id,
                      month: cell.month,
                      price: {
                        priceInMoney: cell.price.priceInMoney - expensePrice.priceInMoney - amortizationPrice.priceInMoney - depreciationPrice.priceInMoney,
                        pricePerUnit: cell.price.pricePerUnit - expensePrice.pricePerUnit - amortizationPrice.pricePerUnit - depreciationPrice.pricePerUnit,
                        unitCount: cell.price.unitCount - expensePrice.unitCount - amortizationPrice.unitCount - depreciationPrice.unitCount,
                      }
                    };
                  });

                  totalAmount = diffCells.reduce((sum, c) => sum + c.price.pricePerUnit, 0);
                  unitCount = diffCells.reduce((sum, c) => sum + c.price.unitCount, 0);
                }
                break;

              case 'NETTO_PELNA':
                // Net Profit = Income - Expenses - Tax - Amortizations - Depreciation - Interest
                if (income && expenses && tax && amortizations && depreciation && interest) {
                  diffCells = income.cells.map((cell, idx) => {
                    const correspondingExpense = expenses.cells.find(c => c.month === cell.month);
                    const correspondingTax = tax.cells.find(c => c.month === cell.month);
                    const correspondingAmortization = amortizations.cells.find(c => c.month === cell.month);
                    const correspondingDepreciation = depreciation.cells.find(c => c.month === cell.month);
                    const correspondingInterest = interest.cells.find(c => c.month === cell.month);

                    const fallback = {price: {priceInMoney: 0, pricePerUnit: 0, unitCount: 0}};

                    const expensePrice = correspondingExpense?.price || fallback.price;
                    const taxPrice = correspondingTax?.price || fallback.price;
                    const amortizationPrice = correspondingAmortization?.price || fallback.price;
                    const depreciationPrice = correspondingDepreciation?.price || fallback.price;
                    const interestPrice = correspondingInterest?.price || fallback.price;

                    return {
                      id: cell.id,
                      month: cell.month,
                      price: {
                        priceInMoney: cell.price.priceInMoney - expensePrice.priceInMoney - taxPrice.priceInMoney - amortizationPrice.priceInMoney - depreciationPrice.priceInMoney - interestPrice.priceInMoney,
                        pricePerUnit: cell.price.pricePerUnit - expensePrice.pricePerUnit - taxPrice.pricePerUnit - amortizationPrice.pricePerUnit - depreciationPrice.pricePerUnit - interestPrice.pricePerUnit,
                        unitCount: cell.price.unitCount - expensePrice.unitCount - taxPrice.unitCount - amortizationPrice.unitCount - depreciationPrice.unitCount - interestPrice.unitCount,
                      }
                    };
                  });

                  totalAmount = diffCells.reduce((sum, c) => sum + c.price.pricePerUnit, 0);
                  unitCount = diffCells.reduce((sum, c) => sum + c.price.unitCount, 0);
                }
                break;
            }

            const diffCategory: Categ = {
              id: Math.max(...flatList.map(c => c.id ?? 0)) + 1,
              name: metricType,
              taxRate: 0,
              primaryType: 'MONEY',
              additionalType: null,
              nestingLevel: 0,
              position: level0Categories.length + 1,
              totalAmount: {priceInMoney: totalAmount, unitCount: unitCount},
              cells: diffCells.sort((a, b) => monthOrder[a.month] - monthOrder[b.month]),
              childCategories: [],
              financialResults: [],
              expandable: false,
              expanded: false,
              hidden: false,
              categoryDescription: null,
            };

            flatList.push(diffCategory);
          });
        }
      }
    }

    return flatList;
  }


  toggleRow(category: Categ) {
    category.expanded = !category.expanded;

    const parentLevel = category.nestingLevel;
    const parentIndex = this.categories.findIndex(c => c.id === category.id);

    for (let i = parentIndex + 1; i < this.categories.length; i++) {
      const child = this.categories[i];

      if (child.nestingLevel <= parentLevel) break;

      child.hidden = !category.expanded;

      if (!category.expanded) {
        child.expanded = false;
      }
    }
  }


  deleteCategory(node: Categ) {
    if (node.nestingLevel === 2) return;
    this.budgetService.deleteCategory(node.id).subscribe({
      next: (response) => {
        console.log('Category deleted successfully:', response);
      },
      error: (err) => {
        console.error('Failed to delete category:', err);
      }
    });
  }

  saveAll(): void {
    let firstCateg = this.categoryWithMetrics as Categ
    let financialResults = firstCateg.financialResults;
    firstCateg.financialResults.forEach((result, index) => {
      this.categories.filter(c => c.name === result.financialMetricType).forEach(categ => {
        let financialCells = result.cells.map(cell => {
          categ.cells.forEach(cc => {
            if (cc.month === cell.month) {
              cell.value = cc.price.priceInMoney;
              return
            }
          })
          return {
            id: cell.id,
            month: cell.month,
            value: cell.value
          } as FinancialCell;
        }) as FinancialCell[];
      })
    })

    firstCateg.cells = []
    firstCateg.childCategories = []
    let categs = this.categories.filter(c => c.nestingLevel === 2);
    categs.push(firstCateg);
    this.budgetService.updateCells(categs).subscribe({
        next: (res) => {
          this.getAllCategories()
        },
        error: (err) => {
          this.getAllCategories()
        }
      }
    )
  }


  getClass(item: any): string {
    if (item.name == 'EBIT' || item.name == 'EBITDA' || item.name == 'NETTO_PELNA') {
      return 'ebit-row';
    }
    if (item.nestingLevel == 0) {
      return 'parent-row';
    }
    if (item.nestingLevel == 1) {
      return 'sub-row';
    }

    return ''

  }

  onPricePerUnitChange(unitType: string, elIndex: number, monthIndex: number, event: Event, id: number, cellId: number): void {

    let value = Number((event.target as HTMLInputElement).value);
    if (unitType === 'pricePerUnit') {
      this.categories[elIndex].cells[monthIndex].price.pricePerUnit = value;
    } else {
      this.categories[elIndex].cells[monthIndex].price.unitCount = value
    }
    this.updateCategoryResponse(id, cellId, value, unitType);

    this.categories[elIndex].cells[monthIndex].price.priceInMoney =
      this.categories[elIndex].cells[monthIndex].price.unitCount * this.categories[elIndex].cells[monthIndex].price.pricePerUnit;
  }

  updateCategoryResponse(id: number, cellId: number, value: number, unitType: string) {
    this.categoryResponse.forEach(c => {
      c.childCategories.forEach(cc => {
        cc.childCategories.forEach(c => {
          if (c.id === id) {
            c.cells.forEach(cell => {
              if (cell.id === cellId) {
                if (unitType === 'pricePerUnit') {
                  cell.price.priceInMoney = value;
                } else {
                  cell.price.pricePerUnit = value;
                }
              }
            })
          }
        })
      })
    })
  }

  onTaxChange(elIndex: number, event: Event) {
    this.categories[elIndex].taxRate = Number((event.target as HTMLInputElement).value);
  }

  onFocus(elIndex: number, monthIndex: number) {
    this.isInputFocused = true;
  }

  onBlur(elIndex: number, monthIndex: number) {
    this.isInputFocused = false;
    this.drawTable(this.categoryResponse);

  }

}
