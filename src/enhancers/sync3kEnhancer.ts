import { GenericStoreEnhancer, StoreEnhancerStoreCreator, Reducer, AnyAction } from 'redux';
import { Sync3kState, Sync3kLocalState } from '../states/sync3kState';
import { sync3kReducer } from '../reducers/sync3kReducer';

const synk3kTimeTraveler = <S>(reducer: Reducer<S>) => (state: S & Sync3kState, action: AnyAction) => {
  if (action.type === '@@sync3k/SYNC3K_TRAVEL_BACK') {
    return action.state;
  }
  return reducer(state, action);
}

const sync3kEnhancer: GenericStoreEnhancer = <S>(createStore: StoreEnhancerStoreCreator<S>) => (reducer: Reducer<S>, preloadedState: S) => {
  const newReducer = synk3kTimeTraveler((state: S & Sync3kState, action) => {
    let sync3k: Sync3kLocalState | undefined, restState: S | undefined;
    if (state !== undefined) {
      let { sync3k: mySync3K, ...myRestState } = (state as Sync3kState);
      sync3k = mySync3K;
      restState = (myRestState as S);
    } else {
      sync3k = undefined;
      restState = undefined;
    }

    const newState = reducer(restState as S, action);
    const sync3kState = {
      ...(newState as {}),
      sync3k: sync3kReducer(sync3k, action) as {},
    } as S & Sync3kState;
    return sync3kState;
  });
  return createStore(newReducer, preloadedState);
}

export default sync3kEnhancer;
