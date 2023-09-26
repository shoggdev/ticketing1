import { Publisher, OrderCancelledEvent, Subjects} from "@shogglearningtixcommon/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}