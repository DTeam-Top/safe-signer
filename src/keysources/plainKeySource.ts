import {ExternallyOwnedAccount} from '@ethersproject/abstract-signer';
import {BytesLike} from 'ethers';
import {SigningKey} from 'ethers/lib/utils';
import KeySource from '../types';

export class PlainKeySource implements KeySource {
  private readonly privateKey;

  constructor(privateKey: BytesLike | ExternallyOwnedAccount | SigningKey) {
    this.privateKey = privateKey;
  }

  getPrivateKey(): Promise<BytesLike | ExternallyOwnedAccount | SigningKey> {
    return Promise.resolve(this.privateKey);
  }
}
