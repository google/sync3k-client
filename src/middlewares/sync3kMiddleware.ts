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

import Dexie from 'dexie';
import uuidV4 = require('uuid/v4');
import { travelBack, encryptedMessage, keyDerivation, setLocalEcdhKey, askForKeys, keyResponse, initializeSync, batchActions } from '../actions/sync3kAction';
import base64js = require('base64-js');
import scrypt = require('scrypt-async');
import { Sync3kState } from '../states/sync3kState';

class SyncEngine {
  baseUrl: string;
  topic: string;
  store;
  next;
  password: string;
  webSocket: WebSocket;
  db;
  headState: Sync3kState;
  watermark: number;
  encryptionInitialized = false;
  ecdhKey;
  askForKeys;
  syncStopped = false;
  sentAskForKeys = false;

  constructor(baseUrl, topic, password, askForKeys, store, next) {
    this.baseUrl = baseUrl;
    this.topic = topic;
    this.store = store;
    this.next = next;
    this.password = password;
    this.askForKeys = askForKeys;
    this.db = new Dexie(`Sync3kLocalDatabase-${topic}`);
    this.db.version(1).stores({
      actions: `&id, message`,
      localActions: `++id, &uuid, message`,
      metadata: `&key, value`,
    });
  }

  initialize() {
    const db = this.db;
    const next = this.next;
    cryptoDriver.setPassword(this.password);
    cryptoDriver.setWaitingForKeyResponse(this.askForKeys);
    if (this.askForKeys) {
      const preKeyInitState = this.store.getState();
      cryptoDriver.setOnKeyReceive((password) => {
        this.stopSync();
        this.next(travelBack(preKeyInitState));
        this.store.dispatch(initializeSync(this.baseUrl, this.topic, password, false));
      });
    }

    let watermark = -1;

    let ecdhKeyPromise = Promise.resolve();

    if (this.password !== '' || this.askForKeys) {
      ecdhKeyPromise = db.metadata.get('ecdhKey').then((ecdhKey) => {
        if (!ecdhKey) {
          return window.crypto.subtle.generateKey({
            name: "ECDH",
            namedCurve: "P-256",
          },
            true,
            ["deriveKey"]).then((key) => {
              return Promise.all([
                window.crypto.subtle.exportKey("jwk", key.publicKey),
                window.crypto.subtle.exportKey("jwk", key.privateKey),
              ]);
            }).then((key) => {
              return db.metadata.put({ key: 'ecdhKey', value: JSON.stringify(key) }).then(() => {
                this.ecdhKey = key;
                return key;
              });
            });
        } else {
          this.ecdhKey = JSON.parse(ecdhKey['value']);
          return this.ecdhKey;
        }
      }).then((ecdhKey) => {
        cryptoDriver.setEcdhKey(ecdhKey);
        return next(setLocalEcdhKey(ecdhKey[0 /* Public Key */]));
      });
    }

    return ecdhKeyPromise.then(() => db.actions.orderBy('id').toArray((actions) => {
      const decryptPromises = actions.map((action) => {
        watermark = action.id;
        next(JSON.parse(action['message']));
        return cryptoDriver.getDecryptPromise(action._sync3k_id);
      });
      return Promise.all(decryptPromises);
    })).then(() => {
      // TODO: remove.
      return new Promise(resolve => setTimeout(resolve, 1000));
    }).then(() => {
      this.watermark = watermark;
      this.headState = this.store.getState();

      // Play uncommitted messages.
      return this.playLocalActions();
    }).then(() => {
      return this.startSync();
    });
  }

  sentInitialKeySpec = false;

  startSync() {
    if (this.syncStopped) {
      return;
    }

    this.webSocket = new WebSocket(`${this.baseUrl}/${this.topic}/${this.watermark + 1}`);
    this.webSocket.onopen = () => this.startCommitLocalEntries();
    this.webSocket.onclose = () => setTimeout(() => this.startSync(), 10000);
    this.webSocket.onmessage = (data) => this.receiveAction(data);

    if (this.password !== '' && !this.sentInitialKeySpec) {
      const newSalt = base64js.fromByteArray(window.crypto.getRandomValues(new Uint8Array(32)));
      // TODO: wait before sending out new key spec.
      this.receiveLocalAction(keyDerivation(uuidV4(), '', newSalt, 'SCRYPT', {
        N: 16384,
        r: 8,
        p: 1
      }));
      this.sentInitialKeySpec = true;
    }

    if (this.askForKeys && !this.sentAskForKeys) {
      this.receiveLocalAction(askForKeys(this.ecdhKey[0 /* Public Key */]));
      this.sentAskForKeys = true;
    }

    // TODO: add error handlers.
  }

  stopSync() {
    if (this.webSocket) {
      this.webSocket.onclose = () => { };
      this.webSocket.close();
    }
    this.syncStopped = true;
  }

  startCommitLocalEntries() {
    if (this.webSocket.readyState !== 1 /* OPEN */) {
      return Promise.resolve(false);
    }

    return this.db.localActions.orderBy('id').toArray((actions) =>
      Promise.all(actions.map((action) => cryptoDriver.encrypt(this.store.getState(), action['message'], action.uuid)))
    ).then((encryptedActions) => {
      for (const action of encryptedActions) {
        this.webSocket.send(action);
      }
    })
      .then(() => {
        setTimeout(() => this.startCommitLocalEntries(), 5000);
        return true;
      });
  }

  playLocalActions() {
    const db = this.db;
    const next = this.next;

    // Play uncommitted messages.
    return db.localActions.orderBy('id').toArray((actions) => {
      actions.forEach((action) => {
        next(JSON.parse(action['message']));
      });
      return true;
    });
  }

  receiveAction(event) {
    const data = JSON.parse(event.data);

    if (data.id <= this.watermark) {
      return Promise.resolve(true);
    }

    const db = this.db;
    const next = this.next;
    const action = JSON.parse(data['message']);

    return db.transaction('rw', db.actions, db.localActions, () => {
      db.actions.put(data);
      db.localActions.where('uuid').equals(action._sync3k_id).delete();
    }).then(() => {
      next(batchActions([
        travelBack(this.headState),
        action,
      ]));
      return cryptoDriver.getDecryptPromise(action._sync3k_id);
    }).then(() => {
      this.watermark = data.id;
      this.headState = this.store.getState();
      return this.playLocalActions();
    });
  }

  receiveLocalAction(action) {
    const db = this.db;
    const next = this.next;

    const newLocalId = uuidV4();
    const localAction = { ...action, _sync3k_id: newLocalId };

    return db.localActions.put({ uuid: newLocalId, message: JSON.stringify(localAction) }).then(() => {
      return next(localAction);
    });
  }
}

export const SyncActions = (store) => (next) => {
  let syncEngine;

  return (action) => {
    if (action.type === '@@sync3k/SYNC3K_INITIALIZE') {
      syncEngine = new SyncEngine(action.baseUrl, action.topic, action.password, action.askForKeys, store, next);
      syncEngine.initialize();
      return next(action);
    }
    let actionToRun;
    if (action.type === '@@sync3k/SYNC3K_CHAIN_KEY_DERIVATION') {
      actionToRun = keyDerivation(action.id, store.getState().sync3k.latest, action.salt, action.algorithm, action.parameters);
    } else {
      actionToRun = action;
    }
    if (action.type === '@@sync3k/SYNC3K_GIVE_KEYS') {
      return cryptoDriver.giveKey(action.targetPublicKey).then((keyMessage) => {
        return syncEngine.receiveLocalAction(keyMessage);
      });
    }
    if (syncEngine !== undefined) {
      return syncEngine.receiveLocalAction(actionToRun);
    }
    return next(actionToRun);
  }
}

const encoder = new TextEncoder('utf-8');
const decoder = new TextDecoder('utf-8');
const cryptoDriver = new class {
  password;
  precomputedKeys = {};
  ecdhKey;
  waitingForKeyResponse = false;
  decryptQueue = [];
  onKeyReceive = (_: string) => { };
  receivedKeys = false;

  setPassword(password) {
    this.password = password;
  }

  setWaitingForKeyResponse(waiting) {
    this.waitingForKeyResponse = waiting;
  }

  setEcdhKey(ecdhKey) {
    this.ecdhKey = ecdhKey;
  }

  setOnKeyReceive(onKeyReceiveHandler) {
    this.onKeyReceive = onKeyReceiveHandler;
  }

  deriveKey(current, specs) {
    if (current === '') {
      return Promise.resolve(this.password);
    }
    if (this.precomputedKeys[current] !== undefined) {
      return this.precomputedKeys[current];
    }
    const currentSpec = specs[current];
    return this.deriveKey(currentSpec.previousId, specs).then((previousKey) => {
      switch (currentSpec.algorithm) {
        case 'SCRYPT':
          const newKey = new Promise((resolve) => {
            return scrypt(previousKey, currentSpec.salt, {
              N: currentSpec.parameters.N,
              r: currentSpec.parameters.r,
              p: currentSpec.parameters.p,
              dkLen: 32,
              encoding: 'binary'
            }, resolve);
          });
          this.precomputedKeys[current] = newKey;
          return newKey;
        default:
          console.error("Unknown algorithm", currentSpec.algorithm);
          return Promise.resolve(previousKey);
      }
    });
  }

  encrypt({ sync3k: { latest, specs } }, msg, uuid) {
    if (this.password === '' && !this.waitingForKeyResponse && !this.receivedKeys) {
      return Promise.resolve(msg);
    }
    const messageType = JSON.parse(msg).type;
    if (messageType === '@@sync3k/SYNC3K_KEY_DERIVATION_ALGORITHM' ||
      messageType === '@@sync3k/SYNC3K_ASK_FOR_KEYS' ||
      messageType === '@@sync3k/SYNC3K_KEY_RESPONSE') {
      return Promise.resolve(msg);
    }
    const aesKeyPromise = this.deriveKey(latest, specs).then((key) => {
      return window.crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['encrypt'])
    });

    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    return aesKeyPromise.then((aesKey) => {
      return window.crypto.subtle.encrypt({
        name: 'AES-CBC',
        iv
      }, aesKey, encoder.encode(msg));
    }).then((encrypted) => {
      const finalArray = new Uint8Array(16 + encrypted.byteLength);
      finalArray.set(iv as Uint8Array);
      finalArray.set(new Uint8Array(encrypted), 16);

      return JSON.stringify(encryptedMessage(base64js.fromByteArray(finalArray), latest, uuid));
    });
  }

  decryptAes(aesKey: CryptoKey, msg: string): PromiseLike<string> {
    const encryptedArray = base64js.toByteArray(msg);
    const iv = encryptedArray.slice(0, 16);
    const encryptedMessage = encryptedArray.slice(16);

    return window.crypto.subtle.decrypt({
      name: 'AES-CBC',
      iv
    }, aesKey, encryptedMessage).then((decrypted) => {
      return decoder.decode(decrypted) as string;
    })
  }

  decrypt({ sync3k: { specs } }, msg) {
    const aesKeyPromise = this.deriveKey(msg['keySpec'], specs).then((key) => {
      return window.crypto.subtle.importKey('raw', key, 'AES-CBC', false, ['decrypt']);
    });

    return aesKeyPromise.then((aesKey) => this.decryptAes(aesKey, msg['message']));
  }

  decrypted = {};

  getDecryptPromise(uuid) {
    if (this.decrypted[uuid] !== undefined) {
      return this.decrypted[uuid];
    }
    return Promise.resolve(true);
  }

  deriveEcdhKey(publicKey, privateKey) {
    return Promise.all([
      window.crypto.subtle.importKey(
        "jwk",
        publicKey,
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        false,
        []
      ),
      window.crypto.subtle.importKey(
        "jwk",
        {
          ...privateKey,
          key_ops: ["deriveKey"]
        },
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        false,
        ["deriveKey"]
      )
    ]).then(([publicKey, privateKey]) => {
      return window.crypto.subtle.deriveKey({
        name: "ECDH",
        namedCurve: "P-256",
        public: publicKey
      } as EcdhKeyDeriveParams,
        privateKey,
        {
          name: "AES-CBC",
          length: 256,
        },
        false,
        ["encrypt", "decrypt"])
    });
  }

  giveKey(targetPublicKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(16));

    return this.deriveEcdhKey(targetPublicKey, this.ecdhKey[1 /* Private Key */])
      .then((aesKey) => {
        const msg = encoder.encode(this.password);
        return window.crypto.subtle.encrypt({
          name: 'AES-CBC',
          iv
        }, aesKey, msg);
      }).then((encrypted) => {
        const finalArray = new Uint8Array(16 + encrypted.byteLength);
        finalArray.set(iv as Uint8Array);
        finalArray.set(new Uint8Array(encrypted), 16);

        return keyResponse(this.ecdhKey[0 /* Public Key */], targetPublicKey, base64js.fromByteArray(finalArray));
      }).catch((err: Error) => console.error(err));
  }

  getMiddleware() {
    return (store) => (next) => (action) => {
      if (action.type === '@@sync3k/SYNC3K_ENCRYPTED') {
        // Create promise for the decryption of the item.
        let decryptResolver;
        const decryptPromise = new Promise((resolve) => { decryptResolver = resolve });
        this.decrypted[action._sync3k_id] = decryptPromise;

        if (this.waitingForKeyResponse) {
          return;
        }

        this.decrypt(store.getState(), action).then((decrypted: string) => {
          next(JSON.parse(decrypted));
          decryptResolver();
        });
        return;
      }
      if (action.type === '@@sync3k/SYNC3K_KEY_RESPONSE' &&
        action.targetPublicKey.x === this.ecdhKey[1].x &&
        action.targetPublicKey.y === this.ecdhKey[1].y &&
        this.waitingForKeyResponse) {
        return this.deriveEcdhKey(action.publicKey, this.ecdhKey[1 /* Private Key*/])
          .then((aesKey: CryptoKey) => {
            this.decryptAes(aesKey, action.encryptedKeys).then((key) => {
              this.password = key;
              this.waitingForKeyResponse = false;
              this.receivedKeys = true;
              this.onKeyReceive(this.password);
            });
          });
      }
      return next(action);
    }
  }
}();

export const DecryptActions = cryptoDriver.getMiddleware();
