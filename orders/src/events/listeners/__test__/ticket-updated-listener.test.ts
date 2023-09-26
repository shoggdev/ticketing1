import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { TicketUpdatedEvent } from '@shogglearningtixcommon/common';
import { TicketUpdatedListener } from "../ticket-updated-listener";
import { natsWrapper } from "../../../nats-wrapper";  // This will be mocked
import { Ticket } from "../../../models/ticket";

// Re-useable setup function
const setup = async () => {
  // Create a listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

 // Create and save a ticket that we can later test updating
 const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  });
  await ticket.save();

  // Create a fake data object
  const data: TicketUpdatedEvent['data'] = {
    id: ticket.id,
    version: ticket.version + 1,  // Faking getting the next version in an event
    title: 'new concert',
    price: 999,
    userId:  'random-doesnt-matter'
  };

  // Create a fake msg object
  // @ts-ignore
  // Line above tells TS to ignore that fact we won't be implementing all the methods on the Message.
  const msg: Message = {
    ack: jest.fn()
  };

  /// Return it all
  return { msg, data, ticket, listener };
};

it('finds, updates and saves a ticket', async ()=>{
  // Create an instance of the listener, Create a ticket in the DB that can be updated, create a fake update data event, Create a fake message object
  const { msg, data, ticket, listener } = await setup();

  // Process the update ticket event
  await listener.onMessage(data, msg);

  // Check to see if the ticket was updated
  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket!.title).toEqual(data.title);
  expect(updatedTicket!.price).toEqual(data.price);
  expect(updatedTicket!.version).toEqual(data.version);
});

it('acks the message', async () => {
  // Create an instance of the listener, Create a ticket in the DB that can be updated, create a fake update data event, Create a fake message object
  const { msg, data, ticket, listener } = await setup();

  // Process the update ticket event
  await listener.onMessage(data, msg);

  // Assert that the ack was call
  expect(msg.ack).toHaveBeenCalled();
});

// Check that we do not process and out of order event if some have been skipped or not yet recevied/procssed.
it('does not call ack if the received event is a version greater than the next version to the one in the DB', async () => {
  // Create an instance of the listener, Create a ticket in the DB that can be updated, create a fake update data event, Create a fake message object
  const { msg, data, ticket, listener } = await setup();
  data.version = 10;  // Over write the version of the data in the event so that it is a future version

  // Process the update ticket event
  try {
    await listener.onMessage(data, msg);
  } catch (err) {
    // We should reach here so all is good.

  }

  // We should reach here whether the onMessage succeeded or threw an error. So we now need to see if ack was called.

  // Assert that the ack was NOT call
  expect(msg.ack).not.toHaveBeenCalled();
});