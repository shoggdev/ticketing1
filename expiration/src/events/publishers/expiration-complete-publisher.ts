import { Subjects, Publisher, ExpirationCompleteEvent } from "@shogglearningtixcommon/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete
}