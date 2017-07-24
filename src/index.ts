import { GenericStoreEnhancer, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';

import sync3kEnhancer from './enhancers/sync3kEnhancer';
import { SyncActions, DecryptActions } from './middlewares/sync3kMiddleware';

export default compose(
    applyMiddleware(SyncActions, DecryptActions, thunk),
    sync3kEnhancer
) as GenericStoreEnhancer;
