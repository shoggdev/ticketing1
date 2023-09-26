import { Subjects, Listener, PaymentCreatedEvent, OrderStatus } from '@shogglearningtixcommon/common';
import { queueGroupName } from './queue-group-name';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
    // Find the order that has just been paid
    const order = await Order.findById(data.orderId);
    if(!order) {
      throw new Error('ERROR PROCESSING PAYMENT-CREATED-EVENT: Order not found in orders service.');
    }

    // Update the order to completed and save to the DB.
    order.set({
      status: OrderStatus.Complete,
    });
    await order.save();

    // URGENT_TODO: Now publish order updated event. We need to add support for this event as it doesnt exist at the moment.

    // Ack the message to the message broker.
    msg.ack();
  }
}