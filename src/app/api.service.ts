import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
export class ApiService {

    /** Endpoint for updating category by ID */
    private categoryApiUrl = 'http://localhost:8088/api/category';

    /** Endpoint returning all categories */
    private categoriesApiUrl = 'http://localhost:8088/api/category/full';

    /** Endpoint for batch-updating cells */
    private patchCellsApiUrl = 'http://localhost:8088/api/cell';

    private budgetsApiUrl = 'http://localhost:8088/api/budget';

    private pendingCategory: any = null;

    constructor(private http: HttpClient) {}

    /**
     * Fetch ALL categories (CategoryDto[]) from the backend.
     */
    getAllCategories(): Observable<any> {
        return this.http.get<any>(this.categoriesApiUrl);
    }

    getAllBudgets(): Observable<any[]> {
        return this.http.get<any[]>(this.budgetsApiUrl + '/full');
    }

    /**
     * Send a PATCH request to update multiple cells at once.
     * The backend expects an array of BatchCellDto objects.
     */
    updateCells(requestBody: BatchCellDto[]): Observable<any> {
        return this.http.patch<any>(this.patchCellsApiUrl, requestBody);
    }

    /**
     * Send a PATCH request to update the tax value of a category by ID.
     * @param categoryId The ID of the category.
     * @param taxValue The updated tax value.
     */
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

    getPendingCategory() {
        return this.pendingCategory;
    }
    clearPendingCategory() {
        this.pendingCategory = null;
    }
}
