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

import * as React from 'react';
import { Component } from 'react';
import Folder from './Folder';
import Fa from './Fa';
import { connect } from 'react-redux';
import { newItem, saveItem, removeItem, moveItem } from '../actions';

class Item extends Component<{ item: any, dispatch: any }, {}> {
  editModeTriggered = false;

  render() {
    const item = this.props.item;

    let titleDisplay;
    if (this.props.item.editMode || this.editModeTriggered) {
      let inputNode;
      const saveHandler = e => {
        this.editModeTriggered = false;
        e.preventDefault();
        this.props.dispatch(saveItem(item.key, { title: inputNode.value.trim(), editMode: false }));
      };
      titleDisplay = (
        <span>
        <input
          defaultValue={item.title}
          ref={node => inputNode = node}
          onKeyPress={e => e.key === 'Enter' && saveHandler(e)}
        />
        <Fa fa="fa-floppy-o" onClick={saveHandler} />
        </span>
      );
    } else {
      titleDisplay = (
        <span>
        {item.title}
        <Fa
          fa="fa-pencil-square-o"
          onClick={e => {
            this.editModeTriggered = true;
            this.forceUpdate();
          }}
        />
        </span>
      );
    }
    return (
      <li>
      {titleDisplay}
      <Fa
        fa="fa-plus-square-o"
        onClick={e => {
          this.props.dispatch(newItem(item.key, {
            title: 'New Item',
            editMode: true,
          }));
        }}
      />
      <Fa
        fa="fa-trash"
        onClick={e => { this.props.dispatch(removeItem(item.key)); }}
      />
      <Fa
        fa="fa-arrow-up"
        onClick={e => { this.props.dispatch(moveItem(item.key, 'UP')); }}
      />
      <Fa
        fa="fa-arrow-down"
        onClick={e => { this.props.dispatch(moveItem(item.key, 'DOWN')); }}
      />
      {item.subitem && item.subitem !== [] && <Folder items={item.subitem} />}
      </li>
    );
  }
}

export default connect()(Item);
