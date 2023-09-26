import { Message } from "node-nats-streaming";
import mongoose from "mongoose";
import { TicketCreatedEvent } from "@shogglearningtixcommon/common";
import { TicketCreatedListener } from "../ticket-created-listener";
import { natsWrapper } from "../../../nats-wrapper"; // This will be mocked
import { Ticket } from "../../../models/ticket";

// Re-useable setup function
const setup = async () => {
  // Create an instance of the listener
  const listener = new TicketCreatedListener(natsWrapper.client);

  // Create a fake data event
  const data: TicketCreatedEvent['data'] = {
    version: 0,
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 10,
    userId: new mongoose.Types.ObjectId().toHexString()
  };

  // Create a fake message object
  // @ts-ignore
  // The above comment tells TS to not complain if we don't implement msg properly.
  // We won't be implementing all the methods.
  const msg: Message = {
    ack: jest.fn()
  };

  return { listener, data, msg };
};

it('creates and saves a ticket', async () => {
  // Create an instance of the listener, Create a fake data event, Create a fake message object
  const { listener, data, msg } = await setup();

  // Call the onMessage function with the data object and message object
  await listener.onMessage(data, msg);

  // Write assertions to make sure a ticket was created
  const ticket = await Ticket.findById(data.id);

  expect(ticket).toBeDefined();
  expect(ticket!.title).toEqual(data.title); // ! keeps TS quiet. If this fails we want to see the error. So this is OK.
  expect(ticket!.price).toEqual(data.price);
});

it('ack the message', async () => {
  // Create an instance of the listener, Create a fake data event, Create a fake message object
  const { listener, data, msg } = await setup();

  // Call the onMessage function with the data object and message object
  await listener.onMessage(data, msg);

  // write assrtions to make sure act function is called
  expect(msg.ack).toHaveBeenCalled();
});