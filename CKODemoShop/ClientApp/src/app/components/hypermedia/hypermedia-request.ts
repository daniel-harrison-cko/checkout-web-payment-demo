export class HypermediaRequest {
  public relation: string;
  public link: string;
  public payload: object;

  constructor(relation: string, link: string) {
    this.relation = relation;
    this.link = link;
    this.payload = this.createPayload(this.relation);
  }

  private createPayload(relation: string): object {
    try {
      switch (relation) {
        case 'klarna:payment-capture': {
          return {
            amount: 100,
            reference: 'Klarna Test Capture',
            metadata: null,
            type: 'klarna',
            klarna: {
              description: 'Klarna Data Description',
              products: [],
              shipping_info: [],
              shipping_delay: 0
            }
          };
        }
        case 'klarna:payment-void': {
          return {
            reference: 'Klarna Test Capture',
            metadata: null
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}
