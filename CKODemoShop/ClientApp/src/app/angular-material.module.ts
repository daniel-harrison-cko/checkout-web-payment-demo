import { NgModule } from '@angular/core';
import { MatButtonModule, MatCheckboxModule, MatInputModule, MatOptionModule, MatSelectModule, MatCardModule, MatSidenavModule, MatToolbarModule, MatIconModule } from '@angular/material';

@NgModule({
  imports: [MatButtonModule, MatCheckboxModule, MatInputModule, MatOptionModule, MatSelectModule, MatCardModule, MatSidenavModule, MatToolbarModule, MatIconModule],
  exports: [MatButtonModule, MatCheckboxModule, MatInputModule, MatOptionModule, MatSelectModule, MatCardModule, MatSidenavModule, MatToolbarModule, MatIconModule]
})
export class AngularMaterialModule { }
