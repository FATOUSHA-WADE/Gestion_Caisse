import { EventEmitter } from 'events';

export const emitter = new EventEmitter();

emitter.setMaxListeners(20);

export const EVENTS = {
  VENTE_CREEE: "vente.creee",
  VENTE_ANNULEE: "vente.annulee",
  USER_CREE: "user.cree"
};