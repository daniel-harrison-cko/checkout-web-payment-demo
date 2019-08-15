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
  public link: string;
  public http_method: string;
  public payload: object;

  constructor(paymentMethod: string, relation: string, link: string, payload: object = null) {
    this.link = link;
    this.http_method = this.relatedHttpMethod(paymentMethod, relation);
    this.payload = payload;
  }

  private relatedHttpMethod(paymentMethodName: string, relationName: string): string {
    try {
      let paymentMethod = RELATEDHTTPMETHODS.find(element => element.paymentMethod == paymentMethodName);
      if (!paymentMethod) throw Error(`Payment Method ${paymentMethodName} is not set up.`);
      let relations = Object.keys(paymentMethod.relations);
      let relation = relations.find(element => element == relationName);
      if (!relation) throw Error(`Relation ${relationName} is not set up for ${paymentMethodName}.`);
      return paymentMethod.relations[relation];
    } catch (e) {
      return 'POST';
    }
  }
}
