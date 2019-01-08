import { IScript } from "./interfaces/script.interface";

export const ScriptStore: IScript[] = [
  {
    name: 'googlepay',
    src: 'https://pay.google.com/gp/p/js/pay.js'
  },
  {
    name: 'cko-frames',
    src: 'https://cdn.checkout.com/js/frames.js'
  },
  {
    name: 'cko-js',
    src: 'https://cdn.checkout.com/sandbox/js/checkout.js'
  }
];
