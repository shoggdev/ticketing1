import { Message, Stan } from 'node-nats-streaming';
import { Subjects } from './subjects';

interface Event {
  subject: Subjects;
  data: any;
}

export abstract class Listener<T extends Event> {

  // These are abstract so must be defined by the subclass
  abstract subject: T['subject'];         // Name of channel to listen to. The subject in the Event interface
  abstract queueGroupName: string;  // Name of the queue group to join on the channel
  abstract onMessage(data: T['data'], msg: Message): void;  // T['data'] means the data in the Event interface

  private client: Stan;             // NATS client, already setup and connected to NATS.
  protected ackWait = 5*1000;       // Time listener has to respond to NATS with an ACK before timeout in ms. Can be redefined by subclass as its protected.

  constructor(client: Stan) {
    this.client = client;
  }

  subscriptionOptions() {
    return this.client
      .subscriptionOptions()                  // Options get chained onto this
      .setDeliverAllAvailable()               // This will get all historical events sent to the listener again after a restart. The entire history will be received if the listener does not have a
                                              // durable subscription. If the listener has a durable subsciption, only those previously not successfulyl ACK'ed by th elisterner are received again.
                                              // However, if the listener is starting for the first time and brand new )ie not restarting), it receives all historical events on the subject.
      .setManualAckMode(true)                 // Disables auto OK acknowledgement on receipt of an event. If the listener fails to process an event, it needs to be redeilvered to another instance.
                                              // We now need to manually ACK after successfully processing each event.
      .setAckWait(this.ackWait)
      .setDurableName(this.queueGroupName);   // Give an id / name to the subscription. NATS remembers which event have been successfully process by a named subsciption. On restart, the listerner get all missed events
                                              // and not those remembered as having already been successfully processed.
                                              // If the listener closes down, NATS will assume its not coming back and, unfortuantely, erase the durable subscription. To stop it doing this, add it to a queue group
                                              // in the call to stan.subscibe()
  }

  listen() {
    const subscription = this.client.subscribe(
      this.subject,                               // Name of the channel to listen to
      this.queueGroupName,                        // Which queue group to join. Groups get events split between them.
                                                  // Also, if any or all listeners in a queue group get disconnected, NATS wont dump the durable subsciption.
      this.subscriptionOptions() );

    // Message recevied event handler
    subscription.on('message', (msg: Message) => {
      console.log(`Message received: ${this.subject} / ${this.queueGroupName}`);

      const parsedData = this.parseMessage(msg);
      this.onMessage(parsedData, msg);
    });
  }

  parseMessage(msg: Message) {
    const data = msg.getData();
    // Detect if its JSON or object. If JSON, parse it.
    return typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString('utf8'));
  }
}
