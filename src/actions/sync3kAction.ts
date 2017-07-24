import { KeyDerivationSpec } from '../states/sync3kState';

export const travelBack = <S>(state: S) => ({
  type: 'SYNC3K_TRAVEL_BACK',
  state,
});

export const initializeSync = (baseUrl: string, topic: string, password: string, askForKeys: boolean) => ({
  type: 'SYNC3K_INITIALIZE',
  baseUrl,
  topic,
  password,
  askForKeys,
});

export const keyDerivation = (id: string, previousId: string, salt: string, algorithm: string, parameters: KeyDerivationSpec) => ({
  type: 'SYNC3K_KEY_DERIVATION_ALGORITHM',
  id,
  previousId,
  salt,
  algorithm,
  parameters,
});

export const chainKeyDerivation = (id: string, salt: string, algorithm: string, parameters: KeyDerivationSpec) => ({
  type: 'SYNC3K_CHAIN_KEY_DERIVATION',
  id,
  salt,
  algorithm,
  parameters,
});

export const encryptedMessage = (message: string, keySpec: KeyDerivationSpec, _sync3k_id: string) => ({
  type: 'SYNC3K_ENCRYPTED',
  message,
  keySpec,
  _sync3k_id
});

export const setLocalEcdhKey = (key: string) => ({ type: 'SYNC3K_LOCAL_KEY', key });

export const askForKeys = (publicKey: {}) => ({
  type: 'SYNC3K_ASK_FOR_KEYS',
  publicKey: publicKey
});

export const giveKeys = (targetPublicKey: {}) => ({
  type: 'SYNC3K_GIVE_KEYS',
  targetPublicKey,
});

export const keyResponse = (publicKey: {}, targetPublicKey: {}, encryptedKeys: string) => ({
  type: 'SYNC3K_KEY_RESPONSE',
  publicKey,
  targetPublicKey,
  encryptedKeys,
});
