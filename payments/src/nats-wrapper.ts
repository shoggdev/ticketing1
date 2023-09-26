import nats, { Stan } from 'node-nats-streaming';

// This file created a wrapper class for the nats client.
// It exports a single isnance of that wrapper that can be imported into any file to obtain access to that same instance.
// Files can then get access to the same instance of the nats client in the same way that the mongoose library works.

class NatsWrapper {
  private _client?: Stan; // ? tells typescript that the property might be undefined for some time and that that is OK.

  // Make sure that if an attempt to use _client is made before it is setup and connected properly, and error results.
  // So use a typescript getter method to access it
  get client() {
    if (!this._client) {
      throw new Error('Cannot access NATS client before connecting');
    }

    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string) {
    // Get a NATS client and save it to the private property
    this._client = nats.connect(
      clusterId,    // The value passed in here should have been defined in the NATS cluster deployment file.
      clientId,     // A random string willliekly be provided
      { url }       // The value provided should be the URL of the service governing acces to the NATS pod. So will will be the service metadata name and port.
    );

    return new Promise<void>( (resolve, reject) => {
      this.client.on('connect', () => {
        console.log('Connected to NATS');
        resolve();
      });
      this.client.on('error', (err) => {
        reject(err);
      });
    });
  }
}

export const natsWrapper = new NatsWrapper();
