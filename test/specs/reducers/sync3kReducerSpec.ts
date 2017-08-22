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

import {initializeSync, setLocalEcdhKey, keyDerivation, askForKeys} from 'src/actions/sync3kAction';
import {sync3kReducer} from 'src/reducers/sync3kReducer';

describe('sync3kReducer', () => {
  it ('should have initial state', () => {
    const result = sync3kReducer(undefined, {type: 'TESTACTION'});
    expect(result).toEqual({
      latest: '',
      specs: {},
      keyRequests: {},
      head: {},
      watermark: -1,      
    });
  });

  it ('should immediately initialize when not for the key', () => {
    const result = sync3kReducer(undefined, initializeSync('http://test.url/start', 'testTopic', '', false));
    expect(result).toEqual({
      latest: '',
      initialized: true,
      waitingForKeys: false,
      specs: {},
      keyRequests: {},
      head: {},
      watermark: -1,
    });
  });

  it('should wait for keys when asking for the key', () => {
    const result = sync3kReducer(undefined, initializeSync('http://test.url/start', 'testTopic', '', true));
    expect(result).toEqual({
      latest: '',
      initialized: false,
      waitingForKeys: true,
      specs: {},
      keyRequests: {},
      head: {},
      watermark: -1,
    });
  });

  it('should store key requests', () => {
    const result = sync3kReducer(undefined, askForKeys({x: 'testX', y: 'testY', key: 'Key'}));
    expect(result).toEqual({
      latest: '',
      specs: {},
      head: {},
      watermark: -1,
      keyRequests: {'testX:testY': {x: 'testX', y: 'testY', key: 'Key'}},
    });
  });

  it('should set local key', () => {
    const result = sync3kReducer(undefined, setLocalEcdhKey('TESTKEY'));
    expect(result).toEqual({
      latest: '',
      specs: {},
      keyRequests: {},
      head: {},
      watermark: -1,
      key: 'TESTKEY',
    });
  });

  it('should set key derivation algorithm', () => {
    const result = sync3kReducer(undefined, keyDerivation('testId', '', 'testSalt', 'testAlgorithm', {test1: 10}));
    expect(result).toEqual({
      keyRequests: {},
      head: {},
      watermark: -1,
      latest: 'testId',
      specs: {
        testId: {
          type: '@@sync3k/SYNC3K_KEY_DERIVATION_ALGORITHM',
          id: 'testId',
          previousId: '',
          salt: 'testSalt',
          algorithm: 'testAlgorithm',
          parameters: {test1: 10},
        },
      },
    });    

    const updatedResult = sync3kReducer(result, keyDerivation('testId2', 'testId', 'testSalt2', 'testAlgorithm2', {test2: 20}));
    expect(updatedResult).toEqual({
      keyRequests: {},
      head: {},
      watermark: -1,
      latest: 'testId2',
      specs: {
        testId: {
          type: '@@sync3k/SYNC3K_KEY_DERIVATION_ALGORITHM',
          id: 'testId',
          previousId: '',
          salt: 'testSalt',
          algorithm: 'testAlgorithm',
          parameters: {test1: 10},
        },
        testId2: {
          type: '@@sync3k/SYNC3K_KEY_DERIVATION_ALGORITHM',
          id: 'testId2',
          previousId: 'testId',
          salt: 'testSalt2',
          algorithm: 'testAlgorithm2',
          parameters: {test2: 20},
        },
      },
    });

    const orphanedUpdateResult = sync3kReducer(updatedResult, keyDerivation('testId3', 'testId', 'testSalt3', 'testAlgorithm3', {test3: -10}));
    expect(orphanedUpdateResult).toEqual({
      keyRequests: {},
      head: {},
      watermark: -1,
      latest: 'testId2',
      specs: {
        testId: {
          type: '@@sync3k/SYNC3K_KEY_DERIVATION_ALGORITHM',
          id: 'testId',
          previousId: '',
          salt: 'testSalt',
          algorithm: 'testAlgorithm',
          parameters: {test1: 10},
        },
        testId2: {
          type: '@@sync3k/SYNC3K_KEY_DERIVATION_ALGORITHM',
          id: 'testId2',
          previousId: 'testId',
          salt: 'testSalt2',
          algorithm: 'testAlgorithm2',
          parameters: {test2: 20},
        },
        testId3: {
          type: '@@sync3k/SYNC3K_KEY_DERIVATION_ALGORITHM',
          id: 'testId3',
          previousId: 'testId',
          salt: 'testSalt3',
          algorithm: 'testAlgorithm3',
          parameters: {test3: -10},          
        }
      },
    });
  });
});
