import {Component, OnInit} from '@angular/core';
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
import {BudgetService} from "../service/budget.service";
import {MonthUtil} from "../util/month-util";


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
  months = new MonthUtil().monthsShort()


  constructor(
    private categoryService: CategoryService,
    private budgetService: BudgetService,
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
        this.budgetService.getById(this.budgetId).subscribe(budget => {
          this.categoryService.getAllCategories(this.budgetId).subscribe({
            next: (response) => {
              this.budgetName = budget.name;
              this.categoryResponse = response as Categ[];
              const categoryDtos = response as Categ[];
              if (categoryDtos.length > 0) {
                this.drawTable(categoryDtos);
              } else {
                this.dataSource = new MatTableDataSource<Categ>([]);
              }
            },
            error: (err) => {
              console.error('Error fetching categories:', err);
            },
          });

        })
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

    let monthUtil = new MonthUtil();
    const monthOrder = monthUtil.monthOrder()

    const calculatePricePerUnit = (pricePerUnit: number, unitCount: number) => {
      return pricePerUnit / unitCount;
    };

    categories.forEach(category => {
      flatList.push(category);

      if (category.childCategories?.length) {
        this.calculateCategoryAggregates(category.childCategories, flatList, false);

        const priceMap = new Map<string, Price>();

        category.childCategories.forEach(child => {
          child.cells.forEach(cell => {
            const unitCount = cell.price.unitCount;
            const priceInMoney = cell.price.priceInMoney;

            if (!priceMap.has(cell.month)) {
              priceMap.set(cell.month, {priceInMoney: 0, pricePerUnit: 0, unitCount: 0});
            }

            const current = priceMap.get(cell.month)!;
            current.priceInMoney += priceInMoney
            current.pricePerUnit += calculatePricePerUnit(priceInMoney, unitCount); // Correct price calculation
            current.unitCount += unitCount;
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
            (sum, cell) => sum + (cell.price.priceInMoney || 0),
            0
          ),
          unitCount: category.cells.reduce(
            (sum, cell) => sum + (cell.price.unitCount),  // Ensure unitCount is not 0
            0
          ),
        };
      } else {
        category.cells.sort((a, b) => monthOrder[a.month] - monthOrder[b.month]);

        category.totalAmount = {
          priceInMoney: category.cells.reduce(
            (sum, cell) => sum + cell.price.priceInMoney,
            0
          ),
          unitCount: category.cells.reduce(
            (sum, cell) => sum + (cell.price.unitCount),  // Ensure unitCount is not 0
            0
          ),
        };
      }
    });

    if (addEbit) {
      const level0Categories = flatList.filter(c => c.nestingLevel === 0);
      if (level0Categories.length >= 1) {
        // Initialize categories with default values if not found
        const getCategoryWithDefault = (categoryDescription: string): Categ => {
          // Find the category by category description
          const category = level0Categories.find(c => c.categoryDescription === categoryDescription);
          if (category) {
            return category;
          }

          // If the category is found, return it, otherwise return a default category
          return {
            id: 0, // default id
            name: categoryDescription, // Default name based on category description
            taxRate: 0, // default tax rate
            primaryType: 'MONEY', // assuming 'MONEY' as default primaryType
            additionalType: null, // assuming no additionalType
            nestingLevel: 0, // assuming 0 for default nestingLevel`
            position: 0, // default position
            totalAmount: {priceInMoney: 0, unitCount: 0}, // default totalAmount
            cells: monthUtil.months().map(m => {
              return {
                id: 0,  // Default ID for cells
                month: m,  // Default month
                price: this.getDefaultPrice()
              }
            }), // default cells
            childCategories: [], // default child categories
            financialResults: [], // default financialResults
            expandable: false, // default expandable
            expanded: false, // default expanded
            hidden: false, // default hidden
            hidePrice: true, // default hidePrice
            categoryDescription: null, // default categoryDescription

          };
        };


        const income = getCategoryWithDefault(CategoryDescription.INCOME);
        const expenses = getCategoryWithDefault(CategoryDescription.EXPENSES);
        const amortizations = getCategoryWithDefault(CategoryDescription.AMORTIZATIONS);
        const depreciation = getCategoryWithDefault(CategoryDescription.DEPRECIATION);
        const tax = getCategoryWithDefault(CategoryDescription.TAX);
        const interest = getCategoryWithDefault(CategoryDescription.INTEREST);

        let financialResults = level0Categories.find(c => c.financialResults && c.financialResults.length > 0)?.financialResults;


        if (financialResults && financialResults.length) {
          financialResults.forEach(financialResult => {
            const metricType = financialResult.financialMetricType;
            let diffCells: Cell[] = [];
            let totalAmount = 0;
            let unitCount = 0;

            switch (metricType) {
              case 'EBITDA':
                // EBITDA = Income - Expenses
                if (income && expenses) {
                  diffCells = income.cells.map((cell, idx) => {
                    const correspondingExpense = expenses.cells.find(c => c.month === cell.month) || {
                      price: this.getDefaultPrice()
                    };
                    const expensePrice = correspondingExpense.price;
                    const cellUnitCount = cell.price.unitCount;

                    return {
                      id: cell.id,
                      month: cell.month,
                      price: {
                        priceInMoney: cell.price.priceInMoney - expensePrice.priceInMoney,
                        pricePerUnit: 0,
                        unitCount: 0,
                      }

                    };
                  });

                  totalAmount = diffCells.reduce((sum, c) => sum + c.price.priceInMoney, 0);
                  unitCount = diffCells.reduce((sum, c) => sum + c.price.unitCount, 0);
                }
                break;

              case 'EBIT':
                // EBIT = Income - Expenses - Amortizations - Depreciation
                if (income && expenses && amortizations && depreciation) {
                  diffCells = income.cells.map((cell, idx) => {
                    const correspondingExpense = expenses.cells.find(c => c.month === cell.month) || {
                      price: this.getDefaultPrice()
                    };
                    const correspondingAmortization = amortizations.cells.find(c => c.month === cell.month) || {
                      price: this.getDefaultPrice()
                    };
                    const correspondingDepreciation = depreciation.cells.find(c => c.month === cell.month) || {
                      price: this.getDefaultPrice()
                    };

                    const expensePrice = correspondingExpense.price;
                    const amortizationPrice = correspondingAmortization.price;
                    const depreciationPrice = correspondingDepreciation.price;

                    return {
                      id: cell.id,
                      month: cell.month,
                      price: {
                        priceInMoney: cell.price.priceInMoney - expensePrice.priceInMoney -
                          amortizationPrice.priceInMoney - depreciationPrice.priceInMoney,
                        pricePerUnit: 0,
                        unitCount: 0,
                      }
                    };
                  });

                  totalAmount = diffCells.reduce((sum, c) => sum + c.price.priceInMoney, 0);
                  unitCount = diffCells.reduce((sum, c) => sum + c.price.unitCount, 0);
                }
                break;

              case 'NETTO_PELNA':
                // Net Profit = Income - Expenses - Tax - Amortizations - Depreciation - Interest
                if (income && expenses && tax && amortizations && depreciation && interest) {
                  diffCells = income.cells.map((cell, idx) => {
                    const correspondingExpense = expenses.cells.find(c => c.month === cell.month) || {
                      price: this.getDefaultPrice()
                    };
                    const correspondingTax = tax.cells.find(c => c.month === cell.month) || {
                      price: this.getDefaultPrice()

                    };
                    const correspondingAmortization = amortizations.cells.find(c => c.month === cell.month) || {
                      price: this.getDefaultPrice()

                    };
                    const correspondingDepreciation = depreciation.cells.find(c => c.month === cell.month) || {
                      price: this.getDefaultPrice()

                    };
                    const correspondingInterest = interest.cells.find(c => c.month === cell.month) || {
                      price: this.getDefaultPrice()

                    };

                    const expensePrice = correspondingExpense.price;
                    const taxPrice = correspondingTax.price;
                    const amortizationPrice = correspondingAmortization.price;
                    const depreciationPrice = correspondingDepreciation.price;
                    const interestPrice = correspondingInterest.price;


                    return {
                      id: cell.id,
                      month: cell.month,
                      price: {
                        priceInMoney: cell.price.priceInMoney - expensePrice.priceInMoney - taxPrice.priceInMoney -
                          amortizationPrice.priceInMoney - depreciationPrice.priceInMoney - interestPrice.priceInMoney,
                        pricePerUnit: 0,
                        unitCount: 0
                      }
                    };
                  });

                  totalAmount = diffCells.reduce((sum, c) => sum + c.price.priceInMoney, 0);
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
              hidePrice: true,
            };

            flatList.push(diffCategory);
          });
        }
      }

      return flatList;
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
    this.categoryService.deleteCategory(node.id).subscribe({
      next: (response) => {
        this.getAllCategories()
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
    this.categoryService.updateCells(categs).subscribe({
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
    if (unitType === 'priceInMoney') {
      this.categories[elIndex].cells[monthIndex].price.priceInMoney = value;
      this.categories[elIndex].cells[monthIndex].price.unitCount = value / this.categories[elIndex].cells[monthIndex].price.pricePerUnit;
    } else {
      this.categories[elIndex].cells[monthIndex].price.unitCount = value
      this.categories[elIndex].cells[monthIndex].price.priceInMoney = value * this.categories[elIndex].cells[monthIndex].price.pricePerUnit;
    }
    this.updateCategoryResponse(id, cellId, value, unitType);

  }

  updateCategoryResponse(id: number, cellId: number, value: number, unitType: string) {
    this.categoryResponse.forEach(c => {
      c.childCategories.forEach(cc => {
        cc.childCategories.forEach(c => {
          if (c.id === id) {
            c.cells.forEach(cell => {
              if (cell.id === cellId) {
                if (unitType === 'priceInMoney') {
                  cell.price.priceInMoney = value;
                } else {
                  cell.price.unitCount = value;
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

  onChange($event: Event, item: Categ) {
    item.hidePrice = !item.hidePrice;
  }

  getDefaultPrice(): Price {
    return {
      priceInMoney: 0, pricePerUnit: 0, unitCount: 0
    }
  }
}
