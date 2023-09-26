import { Message } from 'node-nats-streaming';
import { Listener, OrderCreatedEvent, Subjects } from '@shogglearningtixcommon/common';
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {

    // Build the order record to save in the DB
    const order = Order.build({
      id: data.id,   // We need to specify the id as this is a copy from the orders service and we dont want a generated id.
      price: data.ticket.price,
      status: data.status,
      userId: data.userId,
      version: data.version // We're not modifying the order, just creating a copy created in the orders service, so it should be the same version.
    });
    // Save it to the DB
    await order.save();

    // Ack the message to the message broker
    msg.ack();
  }
}
