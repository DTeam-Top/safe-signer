import {KMSClientConfig} from '@aws-sdk/client-kms';
import {
  GetSecretValueCommandInput,
  SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';
import {AwsKmsSigner} from '@cloud-cryptographic-wallet/aws-kms-signer';
import {CloudKmsSigner} from '@cloud-cryptographic-wallet/cloud-kms-signer';
import {EthersAdapter} from '@cloud-cryptographic-wallet/ethers-adapter';
import {ExternallyOwnedAccount} from '@ethersproject/abstract-signer';
import {BytesLike, Signer, Wallet, providers} from 'ethers';
import {SigningKey} from 'ethers/lib/utils';
import type {ClientOptions} from 'google-gax';
import {VaultConfig} from 'hashi-vault-js';
import {AwsSecretsManagerSourceKey} from './keysources/awsSecretsManagerKeySource';
import {EnvKeySource} from './keysources/envKeySource';
import {
  HashicorpVaultKeySource,
  LoginParams,
  SecretParams,
} from './keysources/hashicorpVaultKeySource';
import KeySource from './types';
import {PlainKeySource} from './keysources/plainKeySource';

export class SafeSigner {
  static async from(
    source: KeySource | Signer,
    provider?: providers.Provider
  ): Promise<Signer> {
    if (source instanceof Signer) {
      if (provider) {
        return source.connect(provider);
      } else {
        return source;
      }
    } else {
      return new Wallet(await source.getPrivateKey(), provider);
    }
  }

  static async fromPrivateKey(
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    provider?: providers.Provider
  ): Promise<Signer> {
    const keySource = new PlainKeySource(privateKey);
    return this.from(keySource, provider);
  }

  static async fromEnv(
    env: string,
    provider?: providers.Provider
  ): Promise<Signer> {
    const keySource = new EnvKeySource(env);
    return this.from(keySource, provider);
  }

  static async fromAwsSecretsManager(
    secretValueOptions: GetSecretValueCommandInput & {SecretKeyName: string},
    awsCredentials?: SecretsManagerClientConfig,
    provider?: providers.Provider
  ): Promise<Signer> {
    const keySource = new AwsSecretsManagerSourceKey(
      secretValueOptions,
      awsCredentials
    );
    return this.from(keySource, provider);
  }

  static async fromAwsKms(
    keyId: string,
    config?: KMSClientConfig,
    provider?: providers.Provider
  ) {
    const awsKmsSigner = new AwsKmsSigner(keyId, config);
    const signer = new EthersAdapter({signer: awsKmsSigner});
    return this.from(signer, provider);
  }

  static async fromGcpKms(
    name: string,
    clientOptions?: ClientOptions,
    provider?: providers.Provider
  ) {
    const cloudKmsSigner = new CloudKmsSigner(name, clientOptions);
    const signer = new EthersAdapter({signer: cloudKmsSigner});
    return this.from(signer, provider);
  }

  static async fromHashicorpVault(
    configParams: VaultConfig,
    loginParams: LoginParams,
    secretParams: SecretParams,
    provider?: providers.Provider
  ) {
    const keySource = await HashicorpVaultKeySource.create(
      configParams,
      loginParams,
      secretParams
    );
    return this.from(keySource, provider);
  }
}
