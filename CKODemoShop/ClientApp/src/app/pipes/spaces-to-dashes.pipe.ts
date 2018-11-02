import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: 'spacesToDashes' })
export class SpacesToDashesPipe implements PipeTransform {
    transform(value: string) {
        if (!value) {
            return '';
        }
      return value.replace(/\s/g, '-');
    }
}
