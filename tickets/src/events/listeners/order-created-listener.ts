import { Message } from 'node-nats-streaming';
import { Listener, OrderCreatedEvent, Subjects } from '@shogglearningtixcommon/common';
import { queueGroupName } from './queue-group-name';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;

  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    // Find the ticket that the order is reserving
    const ticket = await Ticket.findById(data.ticket.id);

    // If the ticket isn't found, throw an error
    if(!ticket) {
      throw new Error('EVENT PROCESSING ERROR. Cannot reserve ticket. Ticket not found!');
    }

    // Mark the ticket as reserved by setting its orderId property
    ticket.set({ orderId: data.id });  // The id of the resource in the event will be that of the order that was created
  
    // Save the ticket
    await ticket.save();

    // We updated the ticket here, and created a new version. Do we must publish a ticket updated event.
    // This listener already has a client (a protected property set in its base class) that we can give to the publisher
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      version: ticket.version,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      orderId: ticket.orderId
    });

    // Ack the message to the message broker.
    msg.ack();
  }
}