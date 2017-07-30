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

import { AnyAction } from 'redux';
import { Sync3kLocalState } from '../states/sync3kState';

export const sync3kReducer = (state: Sync3kLocalState = {latest:'', specs:{}, keyRequests: {}, head: {}, watermark: -1}, action: AnyAction) => {
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
