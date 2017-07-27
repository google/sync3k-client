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
import './App.css';
import Folder from './components/Folder';
import { newRootItem } from './actions';
import { actions } from 'redux-sync3k';
import { connect } from 'react-redux';
import base64js from 'base64-js';
import uuidV4 = require('uuid/v4');

class App extends React.Component<{sync3k: any, dispatch: any, data: any}, {}> {
  render() {

    if (!this.props.sync3k || (!this.props.sync3k.initialized && !this.props.sync3k.waitingForKeys)) {
      let topicInput;
      let passwordInput;
      let askForKeysInput;
      return (
      <div>
        <div>Sync not initialized yet</div>
        <form
          onSubmit={e => {
            e.preventDefault();
            const newTopic = topicInput.value.trim();
            const password = passwordInput.value.trim();
            const askForKeys = askForKeysInput.checked;
            this.props.dispatch(
              actions.initializeSync(`ws://${window.location.hostname}:8080/kafka`, newTopic, password, askForKeys));
            topicInput.value = '';
          }}
        >
          Topic: <input ref={node => topicInput = node} /><br />
          Password: <input ref={node => passwordInput = node} /><br />
          Ask for Keys: <input ref={node => askForKeysInput = node} type="checkbox" /><br />
          <button type="submit">Connect!</button>
        </form>
      </div>
      );
    }

    let input;
    let keyStrengthen;

    if (this.props.sync3k.latest !== '') {
      keyStrengthen = (
      <form
        onSubmit={e => {
        const newSalt = base64js.fromByteArray(window.crypto.getRandomValues(new Uint8Array(32)));
        e.preventDefault();
        this.props.dispatch(
          actions.chainKeyDerivation(uuidV4(), newSalt, 'SCRYPT', {
            N: 16384,
            r: 8,
            p: 1
          }));
        }}
      >
        <button type="submit">Chain key derivation!</button>
      </form>
      );
    }

    let mainForm;

    if (this.props.sync3k.waitingForKeys) {
      mainForm = <div>Waiting for key response</div>;
    } else {
      mainForm = (
      <div>
        <Folder items={this.props.data} />
        <form
          onSubmit={e => {
            e.preventDefault();
            this.props.dispatch(
              newRootItem({ title: input.value.trim(), key: uuidV4() }));
            input.value = '';
          }}
        >
          <input ref={node => input = node} /><button type="submit">Add!</button>
        </form>
        {keyStrengthen}
      </div>
      );
    }

    return (
      <div>
        <div>{this.props.sync3k.key &&
          `x: ${this.props.sync3k.key.x}, y: ${this.props.sync3k.key.y}`}</div>

        {mainForm}
        <div>Pending key requests:</div>
        {Object.keys(this.props.sync3k.keyRequests).map((k) =>
          <div key={k}>
            {k}
            <button
              onClick={(e) => {
                e.preventDefault();
                this.props.dispatch(actions.giveKeys(this.props.sync3k.keyRequests[k]));
              }}
            >
              Give keys
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default connect(
  state => ({data: state.data, sync3k: state.sync3k}),
)(App);
