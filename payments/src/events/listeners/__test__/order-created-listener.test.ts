import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { OrderCreatedEvent, OrderStatus } from '@shogglearningtixcommon/common';
import { natsWrapper } from '../../../nats-wrapper';  // This will be mocked
import { OrderCreatedListener } from '../order-created-listener';
import { Order } from '../../../models/order';

// Setup helper function
const setup = async () => {
  const listener = new OrderCreatedListener(natsWrapper.client);

  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    expiresAt: 'random-doesnt-matter',
    userId: 'random-doesnt-matter',
    status: OrderStatus.Created,
    ticket: {
      id: 'random-doesnt-matter',
      price: 10
    }
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  return {listener, data, msg};
};

it('replicates the order info', async () => {
  // Setup a fake message to listen to
  const { listener, data, msg } = await setup();
  // Trigger the listener with the fake message
  await listener.onMessage(data, msg);

  // Check if the listener processed the event correctly.
  // Check that the order is now in the DB
  const order = await Order.findById(data.id);
  expect(order!.price).toEqual(data.ticket.price);
});

it('acks the message', async () => {
  // Setup a fake event
  const { listener, data, msg } = await setup();
  // Trigger the listener with the fake event
  await listener.onMessage(data, msg);

  // check that the listener acks the message to the message broker.
  expect(msg.ack).toHaveBeenCalled();
});


