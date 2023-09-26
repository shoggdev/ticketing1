import { Message } from "node-nats-streaming";
import { Subjects, Listener, TicketUpdatedEvent } from "@shogglearningtixcommon/common";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: TicketUpdatedEvent['data'], msg: Message) {
    // Find the ticket in the DB to be updated
      //const ticket = await Ticket.findById(id);
    // To support optimistic concurrency control, we must find the ticket by id
    // and check that it is one version behind the consumed update event.
    // This is what our custom static method findByEvent does.
    const ticket = await Ticket.findByEvent(data);
    if(!ticket) {
      // Either the ticket doesn't exist or the right version doesnt exist.
      throw new Error('Ticket not found');
    }

    // Update the ticket in the DB
    ticket.set({
      title: data.title,
      price: data.price
    });

    await ticket.save();

    // Acknowledge the event to the message broker.
    msg.ack();
  }
}