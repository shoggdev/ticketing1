import mongoose from 'mongoose';
import { OrderStatus, OrderCancelledEvent } from '@shogglearningtixcommon/common';
import { OrderCancelledListener } from '../order-cancelled-listener';
import { natsWrapper } from '../../../nats-wrapper'; // This will be mocked
import { Order } from '../../../models/order';

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  // create an order in the DB that we can then cancel
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
    price: 10,
    userId: 'random-doesnt-matter',
    version: 0,
  });
  await order.save();

  // Create an order cancelled event to trigger the listener with
  const data: OrderCancelledEvent['data'] = {
    id: order.id,
    version: 1,       // The next version
    ticket: {
      id: 'random-doesnt-matter'
    }
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  return {listener, order, data, msg };
};

it('updates the status of the order', async () => {
  // Create the listener and a fake event to trigger it with along with an order to cancel in the DB
  const {listener, order, data, msg } = await setup();

  // Trigger the listener with the fake event
  await listener.onMessage(data, msg);

  // Check if the status of the order in the DB was updated to cancelled
  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);

});

it('acks the message to the message broker', async () => {
  // Create the listener and a fake event to trigger it with along with an order to cancel in the DB
  const {listener, order, data, msg } = await setup();

  // Trigger the listener with the fake event
  await listener.onMessage(data, msg);

  // Check if the message was acked to the message broker
  expect(msg.ack).toHaveBeenCalled();
});