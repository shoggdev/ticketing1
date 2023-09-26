import { Subjects, Publisher, PaymentCreatedEvent } from '@shogglearningtixcommon/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
}