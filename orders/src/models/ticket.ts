import mongoose, { mongo } from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { Order, OrderStatus } from './order';

interface TicketAttrs {
  // We need to be able to specify the id so that it is stored with the
  // same id that it had when created in other services
  id: string;
  title: string;
  price: number;
}

// Need to export this so that it can be used in the order model file.
export interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  version: number; // We need to add this here so that it is now part of the TicketDoc defintion.
                  // The definition would otherwise only know about the field called __v
                   // We specify below that we will use this as the version field name and not __v
  isReserved(): Promise<boolean>;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;

  // Finds the record that is one version less than that in the event. Returns a promise
  // if a record can be found or null if no record matching that criteria is found.
  findByEvent( event: { id: string, version: number }): Promise<TicketDoc | null>;
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      }
    }
  }
);

// Tell mongoose to use a field called version for the version field and not the default __v
ticketSchema.set('versionKey', 'version');
ticketSchema.plugin(updateIfCurrentPlugin);

// Methods on the model
ticketSchema.statics.findByEvent = ( event: { id: string, version: number } ) => {
  // To support optimistic concurrency control, we must find the ticket by id
  // and check that it is one version behind the consumed event.
  return Ticket.findOne({
    _id: event.id,
    version: event.version - 1   // Must be one version less than that in the event
  });
};

ticketSchema.statics.build = (attrs: TicketAttrs) => {
  // We don't just pass through attrs to new Ticket().
  // We need the chance to rename the fields. In particular,
  // we need to rename id to _id so that mongoose uses it
  // as the record id in mongo.
  //return new Ticket(attrs);

    // We are specifying the value of the ID here and not leaving it to mongoose to generate.
    // If it was sent through named id, it would be ignored and the record would get a newly
    // generated _id field. So we need to take our id field, rename it to _id here so that
    // mongoose uses it in its _id field.
  return new Ticket({
    _id: attrs.id,
    title: attrs.title,
    price: attrs.price
  });

};

// Methods on document instances
// Use function, not an arrow function so that the this keyword refers to the document
ticketSchema.methods.isReserved = async function() {
  // this === the ticket document that we just called 'isReserved' on

  // Run query to look at all orders. Find an order where
  // the ticket is the ticket we just found AND the order's status is not cancelled.
  // If we find an order for that, it means that the ticket is reserved.
  const existingOrder = await Order.findOne({
    ticket: this,
    status: {
      $in: [
        // Find order with any of the following statuses. i.e. not cancelled
        OrderStatus.Created,
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete
      ]
    }
  });

  return !!existingOrder; // Not, not, value.
}

const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

export { Ticket };