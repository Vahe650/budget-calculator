import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CategoryTableComponent} from './category-table/category-table.component';
import {AddCategoryComponent} from './add-category/add-category.component';
import {BudgetTableComponent} from "./budget-table/budget-table.component";
import {AddBudgetComponent} from "./add-budget/add-budget.component";

export const routes: Routes = [
  {path: 'budgets/:id', component: CategoryTableComponent},
  {path: 'add-category/:id', component: AddCategoryComponent},
  {path: 'add-budget/:id', component: AddBudgetComponent},
  {path: 'add-budget', component: AddBudgetComponent},
  {path: '', component: BudgetTableComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
