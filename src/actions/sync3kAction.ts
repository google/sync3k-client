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

import { KeyDerivationSpec } from '../states/sync3kState';

export const travelBack = <S>(state: S) => ({
  type: '@@sync3k/SYNC3K_TRAVEL_BACK',
  state,
});

export const initializeSync = (baseUrl: string, topic: string, password: string, askForKeys: boolean) => ({
  type: '@@sync3k/SYNC3K_INITIALIZE',
  baseUrl,
  topic,
  password,
  askForKeys,
});

export const keyDerivation = (id: string, previousId: string, salt: string, algorithm: string, parameters: KeyDerivationSpec) => ({
  type: '@@sync3k/SYNC3K_KEY_DERIVATION_ALGORITHM',
  id,
  previousId,
  salt,
  algorithm,
  parameters,
});

export const chainKeyDerivation = (id: string, salt: string, algorithm: string, parameters: KeyDerivationSpec) => ({
  type: '@@sync3k/SYNC3K_CHAIN_KEY_DERIVATION',
  id,
  salt,
  algorithm,
  parameters,
});

export const encryptedMessage = (message: string, keySpec: KeyDerivationSpec, _sync3k_id: string) => ({
  type: '@@sync3k/SYNC3K_ENCRYPTED',
  message,
  keySpec,
  _sync3k_id
});

export const setLocalEcdhKey = (key: string) => ({ type: '@@sync3k/SYNC3K_LOCAL_KEY', key });

export const askForKeys = (publicKey: {}) => ({
  type: '@@sync3k/SYNC3K_ASK_FOR_KEYS',
  publicKey: publicKey
});

export const giveKeys = (targetPublicKey: {}) => ({
  type: '@@sync3k/SYNC3K_GIVE_KEYS',
  targetPublicKey,
});

export const keyResponse = (publicKey: {}, targetPublicKey: {}, encryptedKeys: string) => ({
  type: '@@sync3k/SYNC3K_KEY_RESPONSE',
  publicKey,
  targetPublicKey,
  encryptedKeys,
});
