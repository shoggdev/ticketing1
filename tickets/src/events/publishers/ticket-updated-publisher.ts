import { Publisher, Subjects, TicketUpdatedEvent } from '@shogglearningtixcommon/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}