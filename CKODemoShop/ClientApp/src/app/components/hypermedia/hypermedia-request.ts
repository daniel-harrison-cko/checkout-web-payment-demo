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

  constructor(paymentMethod: string, relation: string, link: string, payload: object = null) {
    this.paymentMethod = paymentMethod;
    this.relation = relation;
    this.link = link;
    this.httpMethod = this.relatedHttpMethod;
    this.payload = payload;
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
      return 'POST';
    }
  }
}
