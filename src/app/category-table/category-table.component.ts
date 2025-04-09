import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';

import {CategoryService} from '../service/category.service';
import {Categ, FinancialCell, Price} from "../model/Price";
import {ActivatedRoute} from "@angular/router";
import {FormGroup} from "@angular/forms";


// Calendar month order for sorting
const monthOrder: Record<string, number> = {
  JANUARY: 1,
  FEBRUARY: 2,
  MARCH: 3,
  APRIL: 4,
  MAY: 5,
  JUNE: 6,
  JULY: 7,
  AUGUST: 8,
  SEPTEMBER: 9,
  OCTOBER: 10,
  NOVEMBER: 11,
  DECEMBER: 12,
};

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

  /** The top-level categories to display. */
  categories: Categ[] = [];

  categoryWithMetrics: {} = {}

  budgetId: number = 0;

  public dataSource: MatTableDataSource<Categ>;

  forms: Array<FormGroup> [] [] = [];


  constructor(
    private budgetService: CategoryService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.dataSource = new MatTableDataSource<Categ>([]);

    this.getAllCAtegories()

  }

  ngOnInit(): void {


  }

  getAllCAtegories() {
    this.activatedRoute.params.subscribe(params => {
      console.log('Budget ID from route:', params['id']);
      if (params['id']) {
        this.budgetId = params['id'];
        this.budgetService.getAllCategories(this.budgetId).subscribe({
          next: (response) => {
            console.log('response from server:', response);
            const categoryDtos = response as Categ[];
            this.categoryWithMetrics = categoryDtos.filter(c => c.financialResults.length > 0)[0] as Categ
            this.categoryWithMetrics
            const categories = this.calculateCategoryAggregates(categoryDtos)
            // sort category by id
            categories.sort((a, b) => {
              if (a.id && b.id) {
                return a.id - b.id;
              }
              return 0;
            });
            // @ts-ignore
            categories[0].financialResults.sort(function (a, b) {
              if (a.financialMetricType && b.financialMetricType) {
                return a.financialMetricType.length < b.financialMetricType.length;
              }
              return 0;
            });
            this.categories = categories
            console.log('Category DTOs from server:', categories);

            this.dataSource = new MatTableDataSource<Categ>(categories);
          },
          error: (err) => {
            console.error('Error fetching categories:', err);
          },
        });
      }
    })

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
            (sum, cell) => sum + cell.price.priceInMoney,
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
            (sum, cell) => sum + cell.price.priceInMoney,
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
        const first = level0Categories.filter(c => c.name === 'doxod')[0];
        const second = level0Categories.filter(c => c.name === 'rasxod')[0];

        console.log(first);

        // Retrieve financial results from the first category
        const financialResults = level0Categories.filter(c => c.financialResults.length > 0)[0].financialResults;

        if (financialResults && financialResults.length) {
          financialResults.forEach(financialResult => {
            const metricType = financialResult.financialMetricType;
            const diffCells = first.cells.map((cell, idx) => {
              const corresponding = second?.cells.find(c => c.month === cell.month);
              const fallback = {price: {priceInMoney: 0, pricePerUnit: 0, unitCount: 0}};

              const secondPrice = corresponding?.price || fallback.price;

              return {
                id: cell.id,
                month: cell.month,
                price: {
                  priceInMoney: cell.price.priceInMoney - secondPrice.priceInMoney,
                  pricePerUnit: cell.price.pricePerUnit - secondPrice.pricePerUnit,
                  unitCount: cell.price.unitCount - secondPrice.unitCount,
                }
              };
            });

            const totalAmount = diffCells.reduce(
              (sum, c) => sum + c.price.priceInMoney, 0
            );
            const unitCount = diffCells.reduce(
              (sum, c) => sum + c.price.unitCount, 0
            );

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

      // Hide or show based on parent’s expanded state
      child.hidden = !category.expanded;

      // Also collapse any sub-child rows
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
    console.log('firstCateg');
    console.log(firstCateg);
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
    console.log(firstCateg);
    let categs = this.categories.filter(c => c.nestingLevel === 2);
    categs.push(firstCateg);
    this.budgetService.updateCells(categs).subscribe({

        next: (res) => {
          this.getAllCAtegories()
        },
        error: (err) => {
          this.getAllCAtegories()

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

  onPricePerUnitChange(elIndex: number, monthIndex: number, event: Event): void {
    this.categories[elIndex].cells[monthIndex].price.priceInMoney = Number((event.target as HTMLInputElement).value);
    this.categories[elIndex].cells[monthIndex].price.pricePerUnit = 0
    this.categories[elIndex].cells[monthIndex].price.unitCount = 0
  }

  onTaxChange(elIndex: number, event: Event) {
    console.log(this.categories[elIndex].taxRate);
    this.categories[elIndex].taxRate = Number((event.target as HTMLInputElement).value);
    console.log(this.categories[elIndex].taxRate);
  }
}
