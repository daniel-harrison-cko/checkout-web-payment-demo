import { NgModule } from '@angular/core';
import { MatButtonModule, MatCheckboxModule, MatInputModule, MatOptionModule, MatSelectModule, MatCardModule, MatSidenavModule, MatToolbarModule, MatIconModule, MatStepperModule, MatRadioModule } from '@angular/material';

@NgModule({
  imports: [MatButtonModule, MatCheckboxModule, MatInputModule, MatOptionModule, MatSelectModule, MatCardModule, MatSidenavModule, MatToolbarModule, MatIconModule, MatStepperModule, MatRadioModule],
  exports: [MatButtonModule, MatCheckboxModule, MatInputModule, MatOptionModule, MatSelectModule, MatCardModule, MatSidenavModule, MatToolbarModule, MatIconModule, MatStepperModule, MatRadioModule]
})
export class AngularMaterialModule { }
