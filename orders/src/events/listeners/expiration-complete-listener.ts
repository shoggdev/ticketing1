import { ExpirationCompleteEvent, Listener, Subjects, OrderStatus } from '@shogglearningtixcommon/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';
import { OrderCancelledPublisher } from '../publishers/order-cancelled-publisher';

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  queueGroupName = queueGroupName;
  readonly subject = Subjects.ExpirationComplete

  async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
    // Process the event. The order will need to be cancelled.

    // Find the order. The expiration event constains the orderId that expired.
    const order = await Order.findById(data.orderId).populate('ticket');;
    if(!order) {
      throw new Error('ERROR PROCESSING EXPIRATION COMPLETE EVENT: Order not found.');
    }

    // Has the order been paid for already? If so, we can't cancell it.
    if(order.status == OrderStatus.Complete) {
      // Return early and ack the message to the message broker.
      //console.log('Wont cancel order now because its been paid for');
      return msg.ack();
    }

    // Set the order status to cancelled
    order.set({
      status: OrderStatus.Cancelled
      // TODO. Consider that we didnt clear the ticket from the order. This is OK. But think about this
      // if the app is upgraded to ticket types and event. Once that happens, the way a ticket shows as reserved
      // in the system will make it even more OK that we dont clear it out of the order. In fact it'd be undesirable.
      // It's good that we can see which ticker the order was cancelled for.
    });

    // Save the updated cancelled order in the DB
    await order.save();

    // Publish an order cancelled event.
    await new OrderCancelledPublisher(this.client).publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id
      }
    });

    // Ack the message to the message broker
    msg.ack();
  }
}