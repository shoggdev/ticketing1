import { OrderCancelledEvent, Subjects, Listener, OrderStatus } from '@shogglearningtixcommon/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    // Find the order that has been cancelled. We don't just search for if.
    // We need to search for the id and the appropriate version - which will be the version before this update.
    const order = await Order.findOne({
      _id: data.id,
      // TODO BETTER TO EXTRACT THIS OUT INTO A FIND BY EVENT METHOD ON ORDER.
      // SEE HOW THIS IS DONE IN THE TICKET UPDATED LISTENER IN THE ORDERS MICRO SERVICE PROJECT.
      version: data.version - 1
    });

    if(!order) {
      throw new Error('ERROR PROCESSING EVENT: Order not found wile processing OrderCancelledEvent in PaymentsService');
    }

    // Set the order to cancelled
    order.set({ status: OrderStatus.Cancelled});
    // Save the order in the DB
    await order.save();

    // Ack the message to the message broker
    msg.ack();
  }

}