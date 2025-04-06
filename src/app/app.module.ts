import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatTableModule } from '@angular/material/table';
import { AppComponent } from './app.component';
import { CategoryTableComponent } from './category-table/category-table.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {BudgetTableComponent} from "./budget-table/budget-table.component";

@NgModule({
    declarations: [

    ],
    imports: [
        BrowserModule,
        MatTableModule,
        BrowserAnimationsModule,
        CategoryTableComponent,
        BudgetTableComponent,
        AppComponent
    ],
    providers: []
})
export class AppModule { }