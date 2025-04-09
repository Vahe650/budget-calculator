import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PaginatedResponse} from "../model/page-model";
import {Budget} from "../model/budget";
import {environment} from "../../environments/environment.dev";

@Injectable({
  providedIn: 'root'
})
export class BudgetService {

  apiUrl = environment.apiUrl;


  private budgetsApiUrl = `${this.apiUrl}/api/budget`;


  constructor(private http: HttpClient) {
  }


  getAllBudgets(): Observable<PaginatedResponse<Budget>> {
    return this.http.get<PaginatedResponse<Budget>>(this.budgetsApiUrl);
  }

  getById(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.budgetsApiUrl}/${id}`);
  }

  deleteBudget(budgetId: number): Observable<any[]> {
    return this.http.delete<any[]>(`${this.budgetsApiUrl}/${budgetId}`);
  }

  save(budget: Budget): Observable<boolean> {
    return this.http.post<any>(this.budgetsApiUrl, budget)
  }

  update(budget: Budget): Observable<Budget> {
    return this.http.patch<Budget>(`${this.budgetsApiUrl}/${budget.id}`, budget);
  }


}
