import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QRCodeService {

    constructor(private _http: HttpClient) { }

    private qrCodeBlobSource = new Subject<Blob>();
    public qrCodeBlob$ = this.qrCodeBlobSource.asObservable();
    public getQrCodeBlob = async (data: string) => {
        let qrCodeBlob = await this.requestQrCodeBlob(data)
        this.qrCodeBlobSource.next(qrCodeBlob);
    }

    private requestQrCodeBlob(data: string): Promise<Blob> {
        return this._http.get(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data}`, {responseType: 'blob'}).toPromise();
    }
}
