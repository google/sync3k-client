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

import * as lodash from 'lodash';
import { AnyAction } from 'redux';

const addNewItem = (items, parentKey, newItem) =>
  items.map((item) => {
    if (item.key !== parentKey) {
      return {
        ...item,
        subitem: item.subitem ? addNewItem(item.subitem, parentKey, newItem) : []
      };
    }
    return {
      ...item,
      subitem: [...(item.subitem || []), newItem]
    };
  });

const saveItem = (items, key, newItem) =>
  items.map((item) => {
    if (item.key !== key) {
      return {
        ...item,
        subitem: item.subitem ? saveItem(item.subitem, key, newItem) : []
      };
    }
    return Object.assign({}, item, newItem);
  });

const removeItem = (items, key) =>
  items
    .filter((item) => item.key !== key)
    .map((item) => ({
      ...item,
      subitem: item.subitem ? removeItem(item.subitem, key) : []
    }));

const moveItemUp = (items, key) =>
  items.reduce((prev, cur) => {
    const newItem = {
      ...cur,
      subitem: cur.subitem ? moveItemUp(cur.subitem, key) : []
    };
    if (prev.length === 0) {
      return [newItem];
    }
    if (cur.key === key) {
      return [...lodash.initial(prev), newItem, lodash.last(prev)];
    }
    return [...prev, newItem];
  },           []);

const moveItemDown = (items, key) =>
  items.reduceRight((prev, cur) => {
    const newItem = {
      ...cur,
      subitem: cur.subitem ? moveItemDown(cur.subitem, key) : []
    };
    if (prev.length === 0) {
      return [newItem];
    }
    if (cur.key === key) {
      return [lodash.head(prev), newItem, ...lodash.tail(prev)];
    }
    return [newItem, ...prev];
  },                []);

export default function(state: Array<{}> = [], action: AnyAction) {
  switch (action.type) {
    case 'NEW_ROOT_ITEM':
      return [...state, action.item];
    case 'NEW_ITEM':
      return addNewItem(state, action.parentKey, action.item);
    case 'SAVE_ITEM':
      return saveItem(state, action.key, action.item);
    case 'REMOVE_ITEM':
      return removeItem(state, action.key);
    case 'MOVE_ITEM':
      switch (action.direction) {
        case 'UP':
          return moveItemUp(state, action.key);
        case 'DOWN':
          return moveItemDown(state, action.key);
        default:
          return state;
      }
    default:
      return state;
  }
}
