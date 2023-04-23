import Vault, {VaultConfig} from 'hashi-vault-js';
import KeySource from '../types';

export type LoginWithAppRole = {
  roleId: string;
  secretId: string;
  mount?: string;
};

export type LoginWithCert = {
  certName: string;
  mount?: string;
};

export type LoginWithK8s = {
  role: string;
  jwt: string;
  mount?: string;
};

export type LoginWithLdap = {
  username: string;
  password: string;
  mount?: string;
};

export type LoginWithUserpass = {
  username: string;
  password: string;
  mount?: string;
};

export type LoginParams = {
  token?: string;
  appRole?: LoginWithAppRole;
  cert?: LoginWithCert;
  k8s?: LoginWithK8s;
  ldap?: LoginWithLdap;
  userpass?: LoginWithUserpass;
};

export type SecretParams = {
  secretName: string;
  secretKey: string;
};

export class HashicorpVaultKeySource implements KeySource {
  private readonly vault: Vault;
  private readonly secretParams: SecretParams;
  private readonly token: string;

  private constructor(secretParams: SecretParams, vault: Vault, token: string) {
    this.vault = vault;
    this.secretParams = secretParams;
    this.token = token;
  }

  static async create(
    configParams: VaultConfig,
    loginParams: LoginParams,
    secretParams: SecretParams
  ): Promise<HashicorpVaultKeySource> {
    const vault = new Vault(configParams);
    let loginResult;
    let token = loginParams.token;
    if (!token) {
      if (loginParams.appRole) {
        const appRole = loginParams.appRole;
        loginResult = await vault.loginWithAppRole(
          appRole.roleId,
          appRole.secretId,
          appRole.mount
        );
      } else if (loginParams.cert) {
        const cert = loginParams.cert;
        loginResult = await vault.loginWithCert(cert.certName, cert.mount);
      } else if (loginParams.k8s) {
        const k8s = loginParams.k8s;
        loginResult = await vault.loginWithK8s(k8s.role, k8s.jwt, k8s.mount);
      } else if (loginParams.ldap) {
        const ldap = loginParams.ldap;
        loginResult = await vault.loginWithLdap(
          ldap.username,
          ldap.password,
          ldap.mount
        );
      } else if (loginParams.userpass) {
        const userpass = loginParams.userpass;
        loginResult = await vault.loginWithUserpass(
          userpass.username,
          userpass.password,
          userpass.mount
        );
      } else {
        throw new Error(
          'At least one of login methods `token`, `appRole`, `cert`, `k8s`, `ldap`, `userpass` for Hashicorp Vault must be provided'
        );
      }

      if ('client_token' in loginResult) {
        token = loginResult.client_token;
      } else {
        throw new Error(
          'Hashicorp Vault login failed: ' + JSON.stringify(loginResult)
        );
      }
    }

    return new HashicorpVaultKeySource(secretParams, vault, token);
  }

  async getPrivateKey(): Promise<string> {
    const readKvSecretResponse = await this.vault.readKVSecret(
      this.token,
      this.secretParams.secretName
    );

    if ('data' in readKvSecretResponse) {
      const data = readKvSecretResponse.data;
      return data[this.secretParams.secretKey] as string;
    } else {
      throw new Error(
        'Hashicorp Vault readKVSecret failed: ' +
          JSON.stringify(readKvSecretResponse)
      );
    }
  }
}
