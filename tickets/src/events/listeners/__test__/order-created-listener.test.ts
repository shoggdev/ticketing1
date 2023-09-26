import { Message } from "node-nats-streaming";
import mongoose from "mongoose";
import { OrderCreatedListener} from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper"; // This will be mocked
import { Ticket } from "../../../models/ticket";
import { OrderCreatedEvent, OrderStatus } from "@shogglearningtixcommon/common";

// Create a setup helper function
const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // Create and save a ticket that should get reserved
  const ticket = Ticket.build({
    title: 'concert',
    price: 99,
    userId: 'random-doesnt-matter'
    // Purposefully not including the orderId as this indicates reserved
    // and the build method doestn support it anyway.
  });
  await ticket.save();

  // Create the fake data event
  const data: OrderCreatedEvent['data'] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,  // Likely to be 0 if it was just created
    status: OrderStatus.Created,
    userId: 'random-doesnt-matter',
    expiresAt: 'random-doesnt-matter',  // Not using this at the moment
    ticket: {
        id: ticket.id,  // Use the id of the ticket we just created
        price: ticket.price
    }
  };

  // Create the fake message
  // @ts-ignore
  // Line above stops TS complaining that we havent implemented the other methods on Message.
  const msg: Message = {
    ack: jest.fn()
  };

  return { listener, ticket, data, msg };
};

it('sets the userId of the ticket', async () => {
  const { listener, ticket, data, msg } = await setup();

  // Process order created event
  await listener.onMessage(data, msg);

  // Get the ticket from DB again and now see if it has been reserved.
  const updatedTicket = await Ticket.findById(ticket.id);

  // data.id will be the id of the resource that the even refers to. Which is the created order.
  // The ticket should have its orderId set to this id.
  expect(updatedTicket!.orderId).toEqual(data.id);
});

it('acks the message', async ()=>{
  const { listener, ticket, data, msg } = await setup();

  // Process order created event
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('publishes a ticket updated event', async () => {
  const { listener, ticket, data, msg } = await setup();

  // Process order created event
  await listener.onMessage(data, msg);

  // Check to see if the ticket updated event was published.
  // Check what the mock publish event got
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // You can see all the calls with their arguments to the mocked publish function you can do this:
  // need the as jest.Mock to tell TS that we have mocked the publish method
  const json = (natsWrapper.client.publish as jest.Mock).mock.calls[0][1];
  const ticketUpdatedData = JSON.parse(json);
  // Check the id of the order in the incoming event to the orderId in the published ticket update event
  expect(data.id).toEqual(ticketUpdatedData.orderId);
});
