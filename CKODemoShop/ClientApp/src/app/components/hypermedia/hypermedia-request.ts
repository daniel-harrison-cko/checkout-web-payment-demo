export class HypermediaRequest {
  link: string;
  payload: object;

  constructor(link: string) {
    this.link = link;
  }
}
