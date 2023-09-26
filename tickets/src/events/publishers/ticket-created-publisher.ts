import { Publisher, Subjects, TicketCreatedEvent } from '@shogglearningtixcommon/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}