import { Message } from "node-nats-streaming";
import { Subjects, Listener, TicketCreatedEvent } from "@shogglearningtixcommon/common";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
    const { id, title, price } = data;

    // Create the ticket in the orders service DB
    const ticket = Ticket.build({
      id,
      title,
      price
    });
    await ticket.save();

    // Acknowledge the event to the message broker.
    msg.ack();
  }
}