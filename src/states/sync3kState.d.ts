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
};

export type Sync3kState = { sync3k?: Sync3kLocalState };
