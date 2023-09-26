import { Listener, OrderCancelledEvent, Subjects } from "@shogglearningtixcommon/common";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    // Find the ticket so that we can un-reserve it
    // data refers to the order that was cancelled.
    const ticket = await Ticket.findById(data.ticket.id);

    // If the ticket isn't found, throw an error
    if(!ticket) {
      throw new Error('EVENT PROCESSING ERROR. Cannot un-reserve ticket. Ticket not found!');
    }

    // Set the ticket to unreserved
    ticket.set({ orderId: undefined }); // Undefined is better than null. Typescript handles undefine dbetter in optional values.

    // Update the ticket as unreserved in the DB
    await ticket.save();

    // Publish a ticket updated event
    // The message broker client can be obtained from this listener's protected property. Set in the base Listener class.
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      orderId: ticket.orderId,  // should be undefined now
      userId: ticket.userId,
      price: ticket.price,
      title: ticket.title,
      version: ticket.version
    });

    // Ack the message to the message broker
    msg.ack();
  }
}