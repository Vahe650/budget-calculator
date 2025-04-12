import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Categ} from "../model/Price";
import {environment} from "../../environments/environment.dev";

/**
 * Represents the request object sent to the PATCH /api/cell endpoint
 * to batch-update cells by ID.
 */
export interface BatchCellDto {
  id: number;
  value: number;
  valueType: 'MONEY' | 'WEIGHT' | 'LITERS' | 'PIECES';
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  apiUrl = environment.apiUrl;

  /** Endpoint for updating category by ID */
  private categoryApiUrl = `${this.apiUrl}/api/category`;

  /** Endpoint returning all categories */
  private categoriesApiUrl = `${this.apiUrl}/api/category/full`;

  /** Endpoint for batch-updating cells */
  private patchCellsApiUrl = `${this.apiUrl}/api/category/full/update`;


  private pendingCategory: any = null;

  constructor(private http: HttpClient) {
  }

  /**
   * Fetch ALL categories (CategoryDto[]) from the backend.
   */
  getAllCategories(budgetId: number): Observable<any> {
    return this.http.get<any>(this.categoriesApiUrl + `?budgetId=${budgetId}`);
  }

  getCategoriesByNestingLevel(nestingLevel: number, parentId: number | string): Observable<any> {
    return this.http.get<any>(this.categoryApiUrl + `?nestingLevel=${nestingLevel}&parentId=${parentId}`);
  }

  updateCells(requestBody: Categ[]): Observable<any> {
    return this.http.patch<any>(this.patchCellsApiUrl, requestBody);
  }


  updateCategoryTax(categoryId: number, taxValue: number): Observable<any> {
    const requestBody = {
      taxRate: taxValue
    };
    console.log(`Updating category ${categoryId} with tax value ${taxValue}`);

    return this.http.patch<any>(`${this.categoryApiUrl}/${categoryId}`, requestBody);
  }

  /**
   * Send a POST request to create a new category.
   * The backend expects a CategoryNewDto object.
   */
  createCategory(requestBody: any): Observable<any> {
    return this.http.post<any>(this.categoryApiUrl, requestBody);
  }

  /**
   * Send a DELETE request to delete a category by ID.
   * @param categoryId The ID of the category to delete.
   */
  deleteCategory(categoryId: number): Observable<any> {
    return this.http.delete<any>(`${this.categoryApiUrl}/${categoryId}`);
  }
}
