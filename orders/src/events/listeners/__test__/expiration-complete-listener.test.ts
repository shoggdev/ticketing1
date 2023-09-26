import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { OrderStatus, ExpirationCompleteEvent } from '@shogglearningtixcommon/common'
import { ExpirationCompleteListener } from "../expiration-complete-listener";
import { natsWrapper } from "../../../nats-wrapper";  // This will be mocked
import { Order } from "../../../models/order";
import { Ticket } from "../../../models/ticket";

// Help function for tests
const setup = async () => {
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  // Create a ticket that we can then order
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  });
  await ticket.save();

  // Create the order
  const order = Order.build({
    status: OrderStatus.Created,
    userId: 'random-doesnt-matter',
    expiresAt: new Date(), // Doesn't matter as we are faking the expiration complete event
    ticket: ticket
  });
  await order.save();

  // Creae the expiration complete event
  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id
  };
  // Tell TS we wont implement all of the methods on Message
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  return { listener, ticket, order, data, msg };
};

it('updates the order status to cancelled', async () => {
  const { listener, ticket, order, data, msg } = await setup();

  // Fake receiving the event
  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('emits an OrderCancelled event', async () => {
  const { listener, ticket, order, data, msg } = await setup();

  // Fake receiving the event
  await listener.onMessage(data, msg);

  // Check that the mocked event publish was called
  expect(natsWrapper.client.publish).toHaveBeenCalled()

  // And with the correct arguments
  // [0] is the first time it was called
  // [1] is the second argument (from that first call)
  const json = (natsWrapper.client.publish as jest.Mock).mock.calls[0][1];
  const eventData = JSON.parse(json);
  expect(eventData.id).toEqual(order.id);
});

it('acks the message', async () => {
  const { listener, ticket, order, data, msg } = await setup();

  // Fake receiving the event
  await listener.onMessage(data, msg);

  // Check that the ack was called
  expect(msg.ack).toHaveBeenCalled();
});