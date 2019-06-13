const RELATEDHTTPMETHODS = [
  {
    'paymentMethod': 'fawry',
    'relations': {
      'approve': 'PUT',
      'cancel': 'PUT'
    }
  }
]

export class HypermediaRequest {
  public paymentMethod: string;
  public relation: string;
  public link: string;
  public httpMethod: string;
  public payload: object;

  constructor(paymentMethod: string, relation: string, link: string) {
    this.paymentMethod = paymentMethod;
    this.relation = relation;
    this.link = link;
    this.httpMethod = this.relatedHttpMethod;
    this.payload = this.createPayload(this.relation);
  }

  private get relatedHttpMethod(): string {
    try {
      let paymentMethod = RELATEDHTTPMETHODS.find(element => element.paymentMethod == this.paymentMethod);
      if (!paymentMethod) throw Error(`Payment Method ${this.paymentMethod} is not set up.`);
      let relations = Object.keys(paymentMethod.relations);
      let relation = relations.find(element => element == this.relation);
      if (!relation) throw Error(`Relation ${this.relation} is not set up for ${this.paymentMethod}.`);
      return paymentMethod.relations[relation];
    } catch (e) {
      console.info('Fallback to default POST HTTP Method.')
      return 'POST';
    }
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
