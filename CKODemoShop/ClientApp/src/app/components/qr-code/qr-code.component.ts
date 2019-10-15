import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { QRCodeService } from '../../services/qr-code.service';

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html'
})

export class QRCodeComponent implements OnInit, OnDestroy {
    @Input() data: string;
    private subscriptions: Subscription[] = [];
    private blob: any;
    private qrCodeImage: any;

  constructor(private _qrCodeService: QRCodeService) { }

    ngOnInit() {
        if (this.data != undefined) {
          this.subscriptions.push(
                this._qrCodeService.getQRCode(this.data).subscribe(blob => this.createImageFromBlob(blob))
              );
        }    
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    private createImageFromBlob(blob: Blob) {
        let fileReader = new FileReader();
        fileReader.addEventListener('load', () => {
            this.qrCodeImage = fileReader.result;
        });
        fileReader.readAsDataURL(blob);
    }
}
