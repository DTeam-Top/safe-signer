import {
  GetSecretValueCommand,
  GetSecretValueCommandInput,
  SecretsManagerClient,
  SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';
import KeySource from '../types';

export class AwsSecretsManagerSourceKey implements KeySource {
  private readonly client: SecretsManagerClient;
  private readonly secretValueOptions: GetSecretValueCommandInput & {
    SecretKeyName: string;
  };

  constructor(
    secretValueOptions: GetSecretValueCommandInput & {
      SecretKeyName: string;
    },
    configuration?: SecretsManagerClientConfig
  ) {
    this.client = new SecretsManagerClient(configuration ?? {});
    this.secretValueOptions = secretValueOptions;
  }

  async getPrivateKey(): Promise<string> {
    const command = new GetSecretValueCommand(this.secretValueOptions);
    const result = await this.client.send(command);
    const secretString = result.SecretString;
    if (!secretString) {
      throw new Error(`No secret found at ${this.secretValueOptions.SecretId}`);
    }
    const privateKey =
      JSON.parse(secretString)[this.secretValueOptions.SecretKeyName];
    if (!privateKey) {
      throw new Error(
        `Secret ${this.secretValueOptions.SecretId} does not have key ${this.secretValueOptions.SecretKeyName}`
      );
    }

    return privateKey;
  }
}
