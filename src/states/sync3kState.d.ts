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

export type KeyDerivationSpec = {};

export type Sync3kLocalState = {
  // Key derivation fields.

  /** Guid for the latest key derivation spec in use. */
  latest: string,

  /** Spec id to key derivation spec mapping. */
  specs: {
    [key: string]: KeyDerivationSpec,
  },

  // Key exchange fields.

  /** Public key to pending key request mapping. */
  keyRequests: {
    [key: string]: {}
  },

  /** Public key of this client. */
  key?: {}

  // Sync ready state fields.

  /** True if Sync3k engine is initialized. */
  initialized?: boolean,

  /** Latest known server state */
  head?: {},

  watermark?: Number,
};

export type Sync3kState = { sync3k: Sync3kLocalState };
