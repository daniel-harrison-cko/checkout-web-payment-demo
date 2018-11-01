import { NgModule } from '@angular/core';
import { MatButtonModule, MatCheckboxModule, MatInputModule, MatOptionModule, MatSelectModule, MatCardModule } from '@angular/material';

@NgModule({
  imports: [MatButtonModule, MatCheckboxModule, MatInputModule, MatOptionModule, MatSelectModule, MatCardModule],
  exports: [MatButtonModule, MatCheckboxModule, MatInputModule, MatOptionModule, MatSelectModule, MatCardModule]
})
export class AngularMaterialModule { }
