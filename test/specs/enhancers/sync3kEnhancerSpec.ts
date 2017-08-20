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
import sync3kEnhancer from 'src/enhancers/sync3kEnhancer';
import {markHeadState, travelBack, batchActions} from 'src/actions/sync3kAction';
import {Sync3kState} from 'src/states/sync3kState';
import {AnyAction, createStore, Store} from 'redux';

type CalculatorState = {
  value: number,
}

const simpleCalculatorReducer = (state: CalculatorState = {value: 0}, action: AnyAction) => {
  switch(action.type) {
    case 'ADD':
      return {...state, value: state.value + action.value};
    case 'MULTIPLY':
      return {...state, value: state.value * action.value};
  }
  return state;
}

const newStore = () => {
  return createStore<CalculatorState>(simpleCalculatorReducer, sync3kEnhancer) as Store<CalculatorState & Sync3kState>;
}

describe('sync3kEnhancer', () => {
  it('should mark head state and store watermark', () => {
    const testStore = newStore();
    testStore.dispatch({type: 'ADD', value: 10});
    expect(testStore.getState()!.value).toEqual(10);
    
    testStore.dispatch(markHeadState(5));

    expect(testStore.getState().sync3k.head).toEqual({value: 10});
    expect(testStore.getState().sync3k.watermark).toEqual(5);
  });

  it('should handle time travel', () => {
    const testStore = newStore();

    testStore.dispatch({type: 'ADD', value: 10});
    expect(testStore.getState().value).toEqual(10);
    
    testStore.dispatch(markHeadState(1));
    
    testStore.dispatch({type: 'ADD', value: 15});
    expect(testStore.getState().value).toEqual(25);

    testStore.dispatch(travelBack());
    
    expect(testStore.getState().value).toEqual(10);
  });

  it('should handle batch processing', () => {
    const testStore = newStore();

    testStore.dispatch(batchActions([
      {type: 'ADD', value:10}, // 10
      markHeadState(1),
      
      {type: 'MULTIPLY', value: 2}, // 20
      {type: 'ADD', value: 15}, // 35
      markHeadState(2),

      {type: 'ADD', value: 15}, // 50
      
      travelBack(), // 35
      
      {type: 'ADD', value: 20}, // 55
    ]));

    expect(testStore.getState().value).toEqual(55);

    // Also check head state marking.
    expect(testStore.getState().sync3k.head).toEqual({value: 35});
    expect(testStore.getState().sync3k.watermark).toEqual(2);
  });
});
