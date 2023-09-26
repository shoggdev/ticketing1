import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// The enforced list of properties that are required to build a payment
interface PaymentAttrs {
  orderId: string;
  stripeId: string;
}

// The listof properties that an order has
interface PaymentDoc extends mongoose.Document {
  // The concept of a mongoose document already contains an id property to we don't
  // need to add it here

  orderId: string;
  stripeId: string;
  // Only need a version if the payment record will be modified after creation.
  // Adding it here so that it's easier if we need it later down the line.
  // All payments will already have an intiial version before we add support for
  // modifying them.
  version: number;
}

// The list of properties that the model contains
interface PaymentModel extends mongoose.Model<PaymentDoc> {
  build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema(
  {
    // Don't need to include version as this will be maintained automatically
    // by the mongoose update if current module.

    orderId: {
      required: true,
      type: String
    },
    stripeId: {
      required: true,
      type: String
    }
  },
  {
    // This will describe to mongoose how to take the payment document and turn it into JSON.
    // We can use this here to transform the document into a form appropriate for sending back to the
    // API client. Such as normalize the id field name and remove fields we want to hide.
    // Command-click on toJSON to see more info on how to use it.
    toJSON: {
      transform(doc, ret) {
        // rename _id to id as it is mongodb specific
        ret.id = ret._id;
        delete ret._id;
      }
    }
  }
);

paymentSchema.set('versionKey', 'version');
paymentSchema.plugin(updateIfCurrentPlugin);

paymentSchema.statics.build = (attrs: PaymentAttrs) => {
  // Mongoose will create the Payment record and generate a brand new id as needed.
  return new Payment(attrs);
};

// The collection in the DB should be called Payment
const Payment = mongoose.model<PaymentDoc, PaymentModel>('Payment', paymentSchema);

export { Payment };