import KeySource from '../types';

export class EnvKeySource implements KeySource {
  private readonly privateKey: string;

  constructor(env: string) {
    if (process.env[env]) {
      this.privateKey = process.env[env]!;
    } else {
      throw new Error(`Environment variable ${env} does not exist`);
    }
  }

  getPrivateKey(): Promise<string> {
    return Promise.resolve(this.privateKey);
  }
}
