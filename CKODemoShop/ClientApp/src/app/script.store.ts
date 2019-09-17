import { IScript } from "./interfaces/script.interface";

export const ScriptStore: IScript[] = [
  {
    name: 'cko-frames',
    src: 'https://cdn.checkout.com/js/framesv2.min.js'
  },
  {
    name: 'cko-js',
    src: 'https://cdn.checkout.com/sandbox/js/checkout.js'
  },
  {
    name: 'googlepay',
    src: 'https://pay.google.com/gp/p/js/pay.js'
  },
  {
    name: 'klarna',
    src: 'https://x.klarnacdn.net/kp/lib/v1/api.js'
  }
];
