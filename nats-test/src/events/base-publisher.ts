import { Stan } from 'node-nats-streaming';
import { Subjects } from './subjects';

interface Event {
  subject: Subjects;
  data: any;
}

export abstract class Publisher<T extends Event> {
  abstract subject: T['subject'];
  private client: Stan;

  constructor(client: Stan) {
    this.client = client;
  }

  publish(data: T['data']): Promise<void> {
    return new Promise( (resolve, reject) => {
      this.client.publish(
        this.subject,           // Name of channel/subject to publish to
        JSON.stringify(data),   // JSON Data to send
        (err) => {                 // Optional callback to be invoked once publish completed
          if(err){
            return reject(err);
          }
          console.log('Event published to subject', this.subject);
          resolve();
        });
    } );
  }
}