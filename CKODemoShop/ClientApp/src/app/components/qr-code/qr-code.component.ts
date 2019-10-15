import { Component, OnInit, OnDestroy, Input, OnChanges } from '@angular/core';
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
        this.subscriptions.push(
            this._qrCodeService.qrCodeBlob$.subscribe(blob => this.createImageFromBlob(blob))
        );
    }

    ngOnChanges(changes) {
        if (changes.data.currentValue != undefined) {
            this._qrCodeService.getQrCodeBlob(changes.data.currentValue);
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
