import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryTableComponent } from './category-table/category-table.component';
import { AddCategoryComponent } from './add-category/add-category.component';
import {BudgetTableComponent} from "./budget-table/budget-table.component";

export const routes: Routes = [
    { path: '', component: CategoryTableComponent },
    { path: 'add-category', component: AddCategoryComponent },
    { path: 'budgets', component: BudgetTableComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
