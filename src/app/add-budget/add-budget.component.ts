import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {BudgetService} from "../service/budget.service";
import {Budget} from "../model/budget";
import {MatInputModule} from "@angular/material/input";
import {ActivatedRoute, Router} from "@angular/router";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";

@Component({
  selector: 'app-add-budget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatSnackBarModule],
  templateUrl: './add-budget.component.html',
  styleUrls: ['./add-budget.component.css']
})
export class AddBudgetComponent implements OnInit {


  constructor(private fb: FormBuilder,
              private router: Router,
              private activatedRoute: ActivatedRoute,
              private budgetService: BudgetService,
              private _snackBar: MatSnackBar) {
  }

  budgetId = 0;

  form = this.fb.group({
    name: new FormControl('', [Validators.required]),
    year: new FormControl(new Date().getFullYear(), [Validators.required]),
  });

  ngOnInit() {

    this.activatedRoute.params.subscribe(params => {
      this.budgetId = params['id'];
      if (this.budgetId > 0) {
        this.budgetService.getById(params['id']).subscribe(budget => {
          this.form.patchValue({
            name: budget.name,
            year: budget.year
          });
        })
      }
    })
  }


  save() {
    let year = this.form.get('year')?.value as number;
    const budgetData: Budget = {
      id: this.budgetId,
      year: year,
      createdAt: '',
      updatedAt: '',
      name: this.form.get('name')?.value as string,
    }
    if (this.budgetId > 0) {
      this.budgetService.update(budgetData).subscribe({
          next: () => {
            this.router.navigate(['/']);
          },
          error: (res) => {
            this._snackBar.open(res.error.description, 'Close', {
              duration: 2000,
            });
          }
        }
      )
    } else {
      this.budgetService.save(budgetData).subscribe(
        {
          next: () => {
            this.router.navigate(['/']);
          },
          error: (res) => {
            this._snackBar.open(res.error.description, 'Close', {
              duration: 2000,
            });
          }
        }
      );
    }

  }

  cancel() {
    this.router.navigate(['/']);
  }
}
