import { AnyAction } from 'redux';
import { Sync3kLocalState } from '../states/sync3kState';

export const sync3kReducer = (state: Sync3kLocalState = {latest:'', specs:{}, keyRequests: {}}, action: AnyAction) => {
  switch (action.type) {
    case '@@sync3k/SYNC3K_INITIALIZE':
      return {...state, initialized: !action.askForKeys, waitingForKeys: action.askForKeys};
    case '@@sync3k/SYNC3K_KEY_DERIVATION_ALGORITHM': {
      const newSpecs = {...state.specs, [action.id]: action};
      if (state.latest === action.previousId) {
        return {...state, latest: action.id, specs: newSpecs};
      }
      return {...state, specs: newSpecs};
    }
    case '@@sync3k/SYNC3K_LOCAL_KEY':
      return {...state, key: action.key};
    case '@@sync3k/SYNC3K_ASK_FOR_KEYS':
      return {...state, keyRequests: {...state.keyRequests, [action.publicKey.x + ":" + action.publicKey.y]: action.publicKey}}
    default:
      return state;
  }
};
