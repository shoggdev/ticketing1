import { Listener, OrderCancelledEvent, OrderCreatedEvent, Subjects } from "@shogglearningtixcommon/common";
import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import { expirationQueue } from "../../queues/expiration-queue";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    // Calcualte, in ms, the difference between the expire time and the current time
    const delay = new Date(data.expiresAt).getTime() - new Date().getTime();
    console.log('Waiting this many milliseconds to process the job', delay);

    // Process the event from the message broker

    // Add a job to the order expiration job queue.
    await expirationQueue.add(
      {
        orderId: data.id  // The id of the order the order created event is about
      },
      {
        delay: delay
      }
    );
    console.log('Delay is set on queue as:', delay);

    // Ack the message to themessage broker
    msg.ack();
  }
}