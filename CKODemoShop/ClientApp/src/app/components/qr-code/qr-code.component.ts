import { Component, OnInit, OnDestroy, Input, OnChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { QRCodeService } from '../../services/qr-code.service';
import { IPayment } from '../../interfaces/payment.interface';

@Component({
    selector: 'app-qr-code',
    templateUrl: './qr-code.component.html'
})

export class QRCodeComponent implements OnInit, OnChanges, OnDestroy {
    @Input() payment: IPayment;
    private subscriptions: Subscription[] = [];
    private blob: any;
    public qrCodeImage: any;

    constructor(
        private _qrCodeService: QRCodeService,
    ) { }

    ngOnInit() {
        this.subscriptions.push(
            this._qrCodeService.qrCodeBlob$.subscribe(blob => this.createImageFromBlob(blob))
        );
    }

    ngOnChanges(changes) {
        if (changes.payment.currentValue.source.qr_data != undefined) {
            this._qrCodeService.getQrCodeBlob(changes.payment.currentValue.source.qr_data);
        } else {
            this.qrCodeImage = null;
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
