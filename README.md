# safe-signer

![build](https://github.com/DTeam-Top/safe-signer/actions/workflows/ci.yml/badge.svg)
![check-code-coverage](https://img.shields.io/badge/code--coverage-98.22%25-brightgreen)
[![npm](https://img.shields.io/npm/dt/@dteam/safe-signer)](https://www.npmjs.com/package/@dteam/safe-signer)
[![npm (scoped)](https://img.shields.io/npm/v/@dteam/safe-signer)](https://www.npmjs.com/package/@dteam/safe-signer)

**If you need a wallet or singer in your backend server, this project is for you.**

It aims to create an [ethers.Signer](https://docs.ethers.org/v5/api/signer/#Signer) from the third party secret storages. Currently, it supports:

- Private key
  - This is only for testing purposes, not recommend in production environments.
- Environment variables
- AWS Secrets Manager
- AWS Key Management Service (KMS)
- Hashicorp Vault

NOTE:

> Currently it supports `ethers@^5` only.

## How to use

### Install

Node >= 16.

```sh
npm i @dteam/safe-signer
```

### Import

Javascript:

```js
const SafeSigner = require('@dteam/safe-signer');
```

Typescript:

```ts
import SafeSigner from '@dteam/safe-signer';
```

### Examples

1. `fromPrivateKey` will return a Wallet.

```ts
const privateKeyWallet = await SafeSigner.fromPrivateKey('YOUR_PRIVATE_KEY');
```

2. `fromEnv` will return a Wallet.

```ts
const envWallet = await SafeSigner.fromEnv('ENV_VAR_FOR_PRIVATE_KEY');
```

3. `fromAwsSecretsManager` will return a Wallet.

```ts
const awsSecretsManagerWallet = await SafeSigner.fromAwsSecretsManager(
  {
    SecretId: 'FULL_ARN_FOR_SECRET',
    SecretKeyName: 'KEY_NAME_STORED_PRIVATE_KEY',
  },
  {
    credentials: {
      accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
      secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
    },
    region: 'YOUR_REGION',
  }
);
```

4. `fromHashicorpVault` will return a Wallet.

```ts
const hashicorpVaultWallet = await SafeSigner.fromHashicorpVault(
  {
    // you can set to your own vault server
    // baseUrl: 'http://127.0.0.1:8200/v1',
    rootPath: 'secret',
    timeout: 6000,
    secretName: 'wallet-secret',
    secretKey: 'privateKey',
  },
  // login method can be any of the following:
  // {token: 'plaintext-token'}
  // {appRole: {roleId: 'roleId', secretId: 'secretId'}}
  // {cert: {certName: 'certName'}}
  // {k8s: {role: 'role', jwt: 'jwt'}}
  // {ldap: {username: 'user', password: 'password'}}
  // {userpass: {username: 'user', password: 'password'}}
  {token: 'vault-plaintext-token'},
  {secretName: 'wallet-secret', secretKey: 'privateKey'}
);
```

5. `fromAwsKms` will return a Signer because you can't get the raw private key from AWS KMS.

```ts
const awsKmsSigner = await SafeSigner.fromAwsKms('YOUR_AWS_KMS_KEY_ARN', {
  credentials: {
    accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
  },
  region: 'YOUR_REGION',
});
```

## How to build

Requirements:

- Node >= 16
- [docker](https://docs.docker.com/engine/install/) / [podman](https://podman.io/getting-started/installation) (required for testing)
- [docker-compose](https://docs.docker.com/compose/) (required for testing)

```sh
npm ci
npm run build
npm test
```
