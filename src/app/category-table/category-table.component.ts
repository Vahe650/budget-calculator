import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';

import {ApiService, BatchCellDto} from '../api.service';

/**
 * Category interface for our local table.
 * We add `cellIdMap` to track each month’s cell ID from the backend.
 */
export interface Category {
  id: number;
  name: string;
  tax: number;
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
  nestingLevel?: 0 | 1 | 2;
  children?: Category[];
  expandable?: boolean;
  expanded?: boolean;

  /**
   * For each month, we track whether input is disabled vs. editable.
   * Also includes 'tax' or 'total' if you want.
   */
  editDisabledMap?: { [fieldName: string]: boolean };

  /**
   * For each month, we store the actual "cell ID" returned by the backend
   * so we know which cell to patch on saving.
   */
  cellIdMap?: { [fieldName: string]: number };

  /**
   * Temporary store of old values when a user toggles the cell (for easy comparison).
   */
  tempValueMap?: { [fieldName: string]: number };
}

/** Flattened display item for the table. */
interface DisplayNode {
  node: Category;
  level: number;
}

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

  /** The top-level categories to display. */
  categories: Category[] = [];

  /** Flattened data for the table. */
  displayData: DisplayNode[] = [];

  constructor(
    private budgetService: ApiService
  ) {
  }

  ngOnInit(): void {
    const pending = this.budgetService.getPendingCategory();
    if (pending) {
      this.categories.push(pending);
      this.budgetService.clearPendingCategory();
    }

    this.loadCategoriesFromServer();
  }

  loadCategoriesFromServer(): void {
    this.budgetService.getAllCategories().subscribe({
      next: (response) => {
        console.log('Fetched categories:', response);
        const categoryDtos = response || [];
        const fromServer = categoryDtos.map((dto: any) => this.transformCategoryDto(dto));
        this.categories = [...this.categories, ...fromServer];

        this.recalculateAll();
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
      },
    });
  }

  /**
   * Convert a CategoryDto => local Category.
   * We also store each cell's ID in cellIdMap so we can do a patch later.
   */
  private transformCategoryDto(dto: any): Category {
    let cells = dto.cells || [];

    let cat: Category = {
      id: dto.id,
      name: dto.name,
      tax: dto.taxRate || 0,
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0,
      jun: 0, jul: 0, aug: 0, sep: 0, oct: 0,
      nov: 0, dec: 0,
      total: dto?.totalAmount?.priceInMoney || 0,
      nestingLevel: 0,
      expandable: true,
      expanded: true,
      editDisabledMap: {
        tax: true, jan: true, feb: true, mar: true, apr: true,
        may: true, jun: true, jul: true, aug: true, sep: true,
        oct: true, nov: true, dec: true, total: true
      },
      cellIdMap: {
        tax: 0, jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0, total: 0
      },
      children: [],
      tempValueMap: {}
    };

    cells.forEach((cell: any) => {
      if (cell.month === 'JANUARY'){
        cat.jan = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['jan'] = cell.id;
      }
      console.log(cat.jan);
      if (cell.month === 'FEBRUARY'){
        cat.feb = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['feb'] = cell.id;
      }
      if (cell.month === 'MARCH'){
        cat.mar = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['mar'] = cell.id;
      }
      if (cell.month === 'APRIL'){
        cat.apr = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['apr'] = cell.id;
      }
      if (cell.month === 'MAY'){
        cat.may = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['may'] = cell.id;
      }
      if (cell.month === 'JUNE'){
        cat.jun = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['jun'] = cell.id;
      }
      if (cell.month === 'JULY'){
        cat.jul = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['jul'] = cell.id;
      }
      if (cell.month === 'AUGUST'){
        cat.aug = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['aug'] = cell.id;
      }
      if (cell.month === 'SEPTEMBER'){
        cat.sep = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['sep'] = cell.id;
      }
      if (cell.month === 'OCTOBER'){
        cat.oct = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['oct'] = cell.id;
      }
      if (cell.month === 'NOVEMBER'){
        cat.nov = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['nov'] = cell.id;
      }
      if (cell.month === 'DECEMBER'){
        cat.dec = Number(cell.price?.priceInMoney || 0);
        cat.cellIdMap!['dec'] = cell.id;
      }

    })


    if (dto.cells && Array.isArray(dto.cells)) {
      dto.cells.forEach((cell: any) => {
        const month = cell.month;
        const priceInMoney = cell.price?.priceInMoney || 0;
        const cellId = cell.id;

        switch (month) {
          case 'JANUARY':
            cat.jan = Number(priceInMoney);
            cat.cellIdMap!['jan'] = cellId;
            break;
          case 'FEBRUARY':
            cat.feb = Number(priceInMoney);
            cat.cellIdMap!['feb'] = cellId;
            break;
          case 'MARCH':
            cat.mar = Number(priceInMoney);
            cat.cellIdMap!['mar'] = cellId;
            break;
          case 'APRIL':
            cat.apr = Number(priceInMoney);
            cat.cellIdMap!['apr'] = cellId;
            break;
          case 'MAY':
            cat.may = Number(priceInMoney);
            cat.cellIdMap!['may'] = cellId;
            break;
          case 'JUNE':
            cat.jun = Number(priceInMoney);
            cat.cellIdMap!['jun'] = cellId;
            break;
          case 'JULY':
            cat.jul = Number(priceInMoney);
            cat.cellIdMap!['jul'] = cellId;
            break;
          case 'AUGUST':
            cat.aug = Number(priceInMoney);
            cat.cellIdMap!['aug'] = cellId;
            break;
          case 'SEPTEMBER':
            cat.sep = Number(priceInMoney);
            cat.cellIdMap!['sep'] = cellId;
            break;
          case 'OCTOBER':
            cat.oct = Number(priceInMoney);
            cat.cellIdMap!['oct'] = cellId;
            break;
          case 'NOVEMBER':
            cat.nov = Number(priceInMoney);
            cat.cellIdMap!['nov'] = cellId;
            break;
          case 'DECEMBER':
            cat.dec = Number(priceInMoney);
            cat.cellIdMap!['dec'] = cellId;
            break;
          default:
            break;
        }
      });
    }

    cat.children = dto.childCategories?.map((childDto: any) => this.transformCategoryDto(childDto)) || [];

    return cat;
  }

  /**
   * Recalculate row totals, then create an EBIT row at the bottom.
   */
  recalculateAll(): void {
    this.categories = this.categories.filter(cat => cat.nestingLevel !== 2);

    this.categories.forEach(row => this.computeRowTotal(row));

    let janRev = 0, febRev = 0, marRev = 0, aprRev = 0, mayRev = 0,
      junRev = 0, julRev = 0, augRev = 0, sepRev = 0, octRev = 0,
      novRev = 0, decRev = 0;
    let janExp = 0, febExp = 0, marExp = 0, aprExp = 0, mayExp = 0,
      junExp = 0, julExp = 0, augExp = 0, sepExp = 0, octExp = 0,
      novExp = 0, decExp = 0;
    let totalRevenueTax = 0, totalExpenseTax = 0;

    const accumulate = (node: Category) => {
      if (node.nestingLevel === 0) {
        janRev += node.jan;
        febRev += node.feb;
        marRev += node.mar;
        aprRev += node.apr;
        mayRev += node.may;
        junRev += node.jun;
        julRev += node.jul;
        augRev += node.aug;
        sepRev += node.sep;
        octRev += node.oct;
        novRev += node.nov;
        decRev += node.dec;
        totalRevenueTax += node.tax;
      } else if (node.nestingLevel === 1) {
        janExp += node.jan;
        febExp += node.feb;
        marExp += node.mar;
        aprExp += node.apr;
        mayExp += node.may;
        junExp += node.jun;
        julExp += node.jul;
        augExp += node.aug;
        sepExp += node.sep;
        octExp += node.oct;
        novExp += node.nov;
        decExp += node.dec;
        totalExpenseTax += node.tax;
      }
      node.children?.forEach(child => accumulate(child));
    };

    this.categories.forEach(row => accumulate(row));

    const ebitRow: Category = {
      id: 0,
      name: 'EBIT',
      nestingLevel: 2,
      tax: 0,
      jan: janRev - janExp,
      feb: febRev - febExp,
      mar: marRev - marExp,
      apr: aprRev - aprExp,
      may: mayRev - mayExp,
      jun: junRev - junExp,
      jul: julRev - julExp,
      aug: augRev - augExp,
      sep: sepRev - sepExp,
      oct: octRev - octExp,
      nov: novRev - novExp,
      dec: decRev - decExp,
      total: 0,
      expandable: false,
      expanded: false,
      editDisabledMap: {},
      cellIdMap: {},
      children: [],
      tempValueMap: {}
    };

    const monthlyEBITSum =
      ebitRow.jan + ebitRow.feb + ebitRow.mar + ebitRow.apr + ebitRow.may +
      ebitRow.jun + ebitRow.jul + ebitRow.aug + ebitRow.sep + ebitRow.oct +
      ebitRow.nov + ebitRow.dec;

    ebitRow.total = monthlyEBITSum + (totalRevenueTax - totalExpenseTax);

    this.categories.push(ebitRow);

    this.updateDisplayData();
  }

  private computeRowTotal(node: Category): void {
    const sumMonths =
      node.jan + node.feb + node.mar + node.apr + node.may +
      node.jun + node.jul + node.aug + node.sep + node.oct +
      node.nov + node.dec;

    node.total = sumMonths + node.tax;
    console.log(node.total);
    node.children?.forEach(child => this.computeRowTotal(child));
  }

  updateDisplayData() {
    this.displayData = this.flattenNodes(this.categories, 0);
  }

  private flattenNodes(nodes: Category[], level: number): DisplayNode[] {
    let result: DisplayNode[] = [];
    for (const node of nodes) {
      result.push({node, level});
      if (node.expanded && node.children && node.children.length > 0) {
        result = result.concat(this.flattenNodes(node.children, level + 1));
      }
    }
    return result;
  }

  toggleRow(node: Category) {
    if (!node.expandable) return;
    node.expanded = !node.expanded;
    this.updateDisplayData();
  }

  deleteCategory(node: Category) {
    if (node.nestingLevel === 2) return;
    this.budgetService.deleteCategory(node.id).subscribe({
      next: (response) => {
        console.log('Category deleted successfully:', response);
        this.removeNode(this.categories, node);
        this.recalculateAll();
      },
      error: (err) => {
        console.error('Failed to delete category:', err);
        this.recalculateAll();
      }
    });
    this.recalculateAll();
  }

  private removeNode(nodes: Category[], target: Category): boolean {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] === target) {
        nodes.splice(i, 1);
        return true;
      }
      if (nodes[i].children?.length) {
        const removed = this.removeNode(nodes[i].children!, target);
        if (removed) return true;
      }
    }
    return false;
  }

  /**
   * When the user clicks a disabled input’s parent <div>, we enable editing
   * and store the old value into tempValueMap for later comparison.
   */
  toggleCellEdit(node: Category, fieldName: string, event: MouseEvent): void {
    event.stopPropagation();
    if (!node.editDisabledMap) return;

    if (node.editDisabledMap[fieldName]) {
      node.editDisabledMap[fieldName] = false;

      if (!node.tempValueMap) {
        node.tempValueMap = {};
      }
      node.tempValueMap[fieldName] = (node as any)[fieldName];
    }
  }

  /**
   * Main "Save" button action:
   *  1) Check all categories for changes by comparing old vs. new values
   *  2) Call updateTax() or patchMonthCell() for each changed field
   *  3) Re-disable all inputs
   *  4) Recalculate totals & EBIT
   */
  saveAll(): void {
    this.saveChangesRecursively(this.categories);

    this.disableAllInputs(this.categories);

    this.recalculateAll();
  }

  /**
   * Recursively walks through categories; for each node, check each field
   * for a difference between tempValueMap[field] and the current node[field].
   * If changed, call the relevant patch method (tax vs. months).
   */
  private saveChangesRecursively(nodes: Category[]): void {
    for (const node of nodes) {
      if (node.nestingLevel !== 2) {
        const fields = ['tax', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

        for (const fieldName of fields) {
          const oldVal = node.tempValueMap?.[fieldName];
          const newVal = (node as any)[fieldName];

          if (oldVal !== undefined && oldVal !== newVal) {
            if (fieldName === 'tax') {
              this.updateTax(node, newVal);
            } else {
              this.patchMonthCell(node, fieldName);
            }
          }
        }
      }

      if (node.children && node.children.length > 0) {
        this.saveChangesRecursively(node.children);
      }
    }
  }

  /**
   * Sets all inputs to disabled, ensuring no further editing until re-click.
   */
  private disableAllInputs(nodes: Category[]): void {
    for (const node of nodes) {
      if (node.editDisabledMap) {
        Object.keys(node.editDisabledMap).forEach(field => {
          node.editDisabledMap![field] = true;
        });
      }
      if (node.children && node.children.length > 0) {
        this.disableAllInputs(node.children);
      }
    }
  }

  /**
   * Update the tax value for the category (API call).
   */
  private updateTax(node: Category, newValue: number): void {
    this.budgetService.updateCategoryTax(node.id, newValue).subscribe({
      next: (response) => {
        console.log('Tax updated successfully:', response);
      },
      error: (err) => {
        console.error('Failed to update tax:', err);
      }
    });
  }

  /**
   * Build a single BatchCellDto and call the patch endpoint for that month’s cell.
   */
  private patchMonthCell(node: Category, fieldName: string): void {
    console.log('Patching month cell for ', fieldName, ' in ', node);
    console.log('Cell ID map:', node.cellIdMap);
    const cellId = node.cellIdMap?.[fieldName];
    if (!cellId) {
      console.warn('No cell ID found for', fieldName, 'in', node);
      return;
    }

    const newValue = Number((node as any)[fieldName]) || 0;

    const requestBody: BatchCellDto[] = [
      {
        id: cellId,
        value: newValue,
        valueType: 'MONEY'
      }
    ];

    this.budgetService.updateCells(requestBody).subscribe({
      next: (resp) => {
        console.log('Cell updated successfully:', resp);
      },
      error: (err) => {
        console.error('Failed to update cell:', err);
      }
    });
  }

  getClass(item: any) :string {

   if  (item.level  == 0) {
      return 'parent-row';
    }
    if  (item.level  == 1) {
      return 'sub-row';
    }


    return ''

  }

  getInputClass(item: any): string {
    if (item.node.name === 'EBIT') {
      return 'input-style';
    }

    if  (item.level  == 0) {
      return 'input-style-parent';
    }
    if  (item.level  == 1) {
      return 'input-style-sub';
    }
    return ''
  }
}
