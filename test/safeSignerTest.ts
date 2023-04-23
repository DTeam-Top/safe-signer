import {
  CreateKeyCommand,
  KMSClient,
  KeySpec,
  KeyUsageType,
} from '@aws-sdk/client-kms';
import {
  CreateSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import test from 'ava';
import {ethers} from 'ethers';
import Vault, {VaultConfig} from 'hashi-vault-js';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
} from 'testcontainers';
import SafeSigner from '../src';
import {
  LoginParams,
  SecretParams,
} from '../src/keysources/hashicorpVaultKeySource';

const randomWallet = ethers.Wallet.createRandom();
const vaultParams: VaultConfig = {
  baseUrl: 'http://127.0.0.1:8200/v1',
  rootPath: 'secret',
  timeout: 6000,
};
const vaultLoginParams: LoginParams = {
  token: 'vault-plaintext-root-token',
};
const vaultSecretParams: SecretParams = {
  secretName: 'wallet-secret',
  secretKey: 'privateKey',
};
const awsCredentials = {
  credentials: {accessKeyId: '', secretAccessKey: ''},
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
};
const secretValueOptions = {
  SecretId: 'MyWallet',
  SecretKeyName: 'privateKey',
};

let dockerEnvornment: StartedDockerComposeEnvironment;
let awsKmsKeyArn: string;

async function initVault() {
  const vault = new Vault(vaultParams);
  return vault.createKVSecret(
    vaultLoginParams.token!,
    vaultSecretParams.secretName,
    {
      [vaultSecretParams.secretKey]: randomWallet.privateKey,
    }
  );
}

async function initAwsSecretsManager() {
  const awsSecretsManagerClient = new SecretsManagerClient(awsCredentials);
  const command = new CreateSecretCommand({
    Name: secretValueOptions.SecretId,
    SecretString: JSON.stringify({
      [secretValueOptions.SecretKeyName]: randomWallet.privateKey,
    }),
  });
  return awsSecretsManagerClient.send(command);
}

async function initAwsKms() {
  const client = new KMSClient(awsCredentials);
  const command = new CreateKeyCommand({
    KeyUsage: KeyUsageType.SIGN_VERIFY,
    KeySpec: KeySpec.ECC_SECG_P256K1,
  });
  const result = await client.send(command);
  awsKmsKeyArn = result.KeyMetadata!.Arn!;
}

test.before(async () => {
  dockerEnvornment = await new DockerComposeEnvironment(
    '.',
    'compose.yaml'
  ).up();
  const promises = [];
  promises.push(initVault(), initAwsSecretsManager(), initAwsKms());
  return Promise.allSettled(promises);
});

test.after.always(async () => {
  if (dockerEnvornment) {
    await dockerEnvornment.down({removeVolumes: true});
  }
});

test('plain private key should work', async t => {
  const privateKey = randomWallet.privateKey;
  const wallet = await SafeSigner.fromPrivateKey(privateKey);
  const walletAddress = await wallet.getAddress();
  t.deepEqual(walletAddress, randomWallet.address);
  const message = 'hello';
  const signedMessage = await wallet.signMessage(message);
  const verifiedAddress = ethers.utils.verifyMessage(message, signedMessage);
  t.deepEqual(walletAddress, verifiedAddress);
});

test('private key from environment variable should work', async t => {
  process.env.PRIVATE_KEY = randomWallet.privateKey;
  const wallet = await SafeSigner.fromEnv('PRIVATE_KEY');
  t.deepEqual(await wallet.getAddress(), randomWallet.address);
});

test('private key from environment variable should throw Error if env not exists', async t => {
  delete process.env.NOT_EXIST_KEY;
  await t.throwsAsync(SafeSigner.fromEnv('NOT_EXIST_KEY'), {
    instanceOf: Error,
    message: 'Environment variable NOT_EXIST_KEY does not exist',
  });
});

test('private key from AWS Secrets Manager should work', async t => {
  const wallet = await SafeSigner.fromAwsSecretsManager(
    secretValueOptions,
    awsCredentials
  );
  t.deepEqual(await wallet.getAddress(), randomWallet.address);
});

test('private key from Hashicorp Vault should work', async t => {
  const wallet = await SafeSigner.fromHashicorpVault(
    vaultParams,
    vaultLoginParams,
    vaultSecretParams
  );
  t.deepEqual(await wallet.getAddress(), randomWallet.address);
});

test('AWS KMS signer should work', async t => {
  const wallet = await SafeSigner.fromAwsKms(awsKmsKeyArn, awsCredentials);
  const walletAddress = await wallet.getAddress();
  const message = 'hello';
  const signedMessage = await wallet.signMessage(message);
  const verifiedAddress = ethers.utils.verifyMessage(message, signedMessage);
  t.deepEqual(walletAddress, verifiedAddress);
});
