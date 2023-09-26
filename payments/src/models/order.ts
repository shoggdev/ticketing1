import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { OrderStatus } from "@shogglearningtixcommon/common";

// The enforced list of properties that are required to build an order
interface OrderAttrs {
  id: string;               // Need to know which order in being paid for
  version: number;          // As we will be modifying the order we need to propoagate a version
  userId: string;           // Needed to govern access to the order and who can / has pay for it etc.
  price: number;            // Needed to know how much the payment will need to be
  status: OrderStatus;      // Need to change this after payment
}

// The listof properties that an order has
interface OrderDoc extends mongoose.Document {
  // The concept of a mongoose document already contains an id property to we don't need to add it here
  version: number;
  userId: string;
  price: number;
  status: OrderStatus;
}

// The list of properties that the model contains
interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
}

const orderSchema = new mongoose.Schema(
  {
    // Don't need to include version as this will be maintained automatically by the mongoose update if current module.
    userId: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),  // Mongoose will make sure this can only be set to one of the values in this enum
    }
  },
  {
    // This will describe to mongoose how to take the order document and turn it into JSON.
    // We can use this here to transform the document into a form appropriate for sending back to the
    // API client. Such as normalize the id field name and remove fields we want to hide.
    // Command-click on toJSON to see more info on how to use it.
    toJSON:
    {
      transform(doc, ret) {
        // rename _id to id as it is mongodb specific
        ret.id = ret._id;
        delete ret._id;
      }
    }
  }
);

orderSchema.set('versionKey', 'version');
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (attrs: OrderAttrs) => {
  return new Order({
    // This attrs object is going to have an id property, but when we pass it into the contructor,
    // we must rename it to _id instead.
    // We don't just pass through attrs to new Order().
    // We need the chance to rename the fields. In particular,
    // we need to rename id to _id so that mongoose uses it
    // as the record id in mongo.

    // We are specifying the value of the ID here and not leaving it to mongoose to generate.
    // If it was sent through named id, it would be ignored and the record would get a newly
    // generated _id field. So we need to take our id field, rename it to _id here so that
    // mongoose uses it in its id field.
    _id: attrs.id,
    version: attrs.version,
    price: attrs.price,
    userId: attrs.userId,
    status: attrs.status
  });
};

// The collection in the DB should be called Order
const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order };