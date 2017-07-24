import { GenericStoreEnhancer, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import sync3kEnhancer from './enhancers/sync3kEnhancer';
import { initializeSync, chainKeyDerivation, giveKeys } from './actions/sync3kAction';
import { SyncActions, DecryptActions } from './middlewares/sync3kMiddleware';

export const actions = {
  initializeSync, chainKeyDerivation, giveKeys
};

export const enhancer = compose(
  applyMiddleware(SyncActions, DecryptActions, thunk),
  sync3kEnhancer
) as GenericStoreEnhancer;
