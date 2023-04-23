import {ExternallyOwnedAccount} from '@ethersproject/abstract-signer';
import {BytesLike} from 'ethers';
import {SigningKey} from 'ethers/lib/utils';

/**
 * KeySource interface. All KeySource should implement this interface
 */
export default interface KeySource {
  /**
   * getPrivateKey method, should return string or bytes
   */
  getPrivateKey(): Promise<BytesLike | ExternallyOwnedAccount | SigningKey>;
}
