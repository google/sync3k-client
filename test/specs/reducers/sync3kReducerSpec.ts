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

import {initializeSync, setLocalEcdhKey} from 'src/actions/sync3kAction';
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
});
