//import { Message } from "node-nats-streaming";
import mongoose from "mongoose";
import { OrderCancelledListener} from "../order-cancelled-listener";
import { natsWrapper } from "../../../nats-wrapper"; // This will be mocked
import { Ticket } from "../../../models/ticket";
import { OrderCancelledEvent} from "@shogglearningtixcommon/common";
import { Message } from "node-nats-streaming";

// Create a setup helper function
const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);

  const orderId = new mongoose.Types.ObjectId().toHexString();

  // Create and save a ticket that should be getting unreserved
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    userId: 'random-doesnt-matter'
    // Purposefully not including the orderId as the build method doesnt support it.
    // This is a brand new ticket that cant be reserved upon creation.
  });
  // Make the ticket look reserved.
  ticket.set({orderId: orderId});
  // Save the reserved ticket to the DB.
  await ticket.save();

  // Create the fake data event
  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 0,  // doesnt matter here
    ticket: {
        id: ticket.id,  // Use the id of the ticket we just created
    }
  };

  // Create the fake message
  //@ts-ignore
  // Line above stops TS complaining that we havent implemented the other methods on Message.
  const msg: Message = {
    ack: jest.fn()
  };

  return { listener, ticket, data, msg, orderId };
};

it('updates the ticket, publishes an event, and acks the message', async () => {
  // set up a listner, areserved ticket and create a fake order cancelled event
  const { listener, ticket, data, msg, orderId } = await setup();

  // process the order cancelled event
  await listener.onMessage(data, msg);

  // Ckeck the ticket has now been unreserved
  const updatedTicket = await Ticket.findById(ticket.id);
  expect(updatedTicket!.orderId).not.toBeDefined();

  // Check that the order cancelled event was acked
  expect(msg.ack).toHaveBeenCalled();

  // Check that the ticket updated event was published
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // Check the content of the ticket updated event
  const json = (natsWrapper.client.publish as jest.Mock).mock.calls[0][1];
  const ticketUpdatedData = JSON.parse(json);
  expect(ticketUpdatedData.orderId).not.toBeDefined();
  expect(ticketUpdatedData.id).toEqual(ticket.id);
});