// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { GenericStoreEnhancer, StoreEnhancerStoreCreator, Reducer, AnyAction } from 'redux';
import { Sync3kState, Sync3kLocalState } from '../states/sync3kState';
import { sync3kReducer } from '../reducers/sync3kReducer';

const synk3kTimeTraveler = <S>(reducer: Reducer<S>) => function batcher(state: S & Sync3kState, action: AnyAction) {
  if (action.type === '@@sync3k/SYNC3K_TRAVEL_BACK') {
    return action.state;
  }
  if (action.type === '@@sync3k/SYNC3K_BATCH') {
    return action.payload.reduce(batcher, state);
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
