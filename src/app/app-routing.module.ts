import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BudgetTableComponent } from './budget-table/budget-table.component';
import { AddCategoryComponent } from './add-category/add-category.component'; // <-- import

const routes: Routes = [
    { path: '', component: BudgetTableComponent },
    { path: 'add-category', component: AddCategoryComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
