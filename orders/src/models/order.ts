import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { OrderStatus } from "@shogglearningtixcommon/common";
import { TicketDoc } from "./ticket";

export { OrderStatus }; // Re-exported so that it can be imported from the same file the model is imported from.

// An interface that describes the properties that are required to create a new order
// This is used to enforce the types and fields required to pass into the custom build
// method implemented blow.
interface OrderAttrs {
  userId: string;        // Type for typescript
  status: OrderStatus;
  expiresAt: Date;
  ticket: TicketDoc;  // This is an instance of ticket
}

// An interface that describes the properties that an Order DOCUMENT has. This is used
// to tell typescript that the properties read out of an Order DOCUMENT are different and a superset
// of those used to create the document through the model.
// This interface will allow us to safely, in typescript, access properties using
// syntax like orderInstance.title and ticketInstance.price
interface OrderDoc extends mongoose.Document {
  // These are properties that are in addition to those on the base Document
  userId: string;        // Type for typescript
  status: OrderStatus;     // Type for typescript
  expiresAt: Date;
  ticket: TicketDoc;  // This is an instance of ticket
  version: number;  // We need to add this here so that it is now part of the OrderDoc definition.
                    // The definition would otherwise only know about the field called __v
                    // We specify below that we will use this as the version field name and not __v
  // We could add createdAt and updatedAt if mongoose added these and we want them.
}

// An interface that describes the properties that an Order model has.
// This is needed to tell typescript about the custom static functions like build(),
// that have been added.
// See below for angled brackets notes.
interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc; // Specifying that this will return an instance of OrderDoc
}

// The type infomation in the order schema is not typescript. This is mongoose stuff.
// Also note that the string type in typescript is lowercase 's' too.
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,   // Actual type used by mongoose, not typescript.
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),  // Mongoose will make sure this can only be set to one of the values in this enum
      default: OrderStatus.Created       // We can add a default value to make sure there is a value. Not sure this is necessary...
    },
    expiresAt: {
      type: mongoose.Schema.Types.Date
      //required: false /// This doesnt need to be required. Paid for tickets dont expire.
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket'
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
  });

// Tell mongoose to use a field called version for the version field and not the default __v
orderSchema.set('versionKey', 'version');
orderSchema.plugin(updateIfCurrentPlugin);

  // Use this custom static function build() to create a new Order document instead of using new Order()
// This will enable us to use typescript type checking by enforcing use of the OrderAttrs interface
orderSchema.statics.build = (attrs: OrderAttrs) => {
  return new Order(attrs);
};

// See below for angled brackets notes.
const Order = mongoose.model<OrderDoc, OrderModel>(
  'Order',        // Name of the collection
  orderSchema);

export { Order };

// TYPSCRIPT ANGLED BRACKETS
// The angled brackets described types that relate to the function. They are like type arguments
// to the function rather than data arguments that get passed into the normal () parentheses.
// Holding command and clicking on the function will go to its typescript definition.
// The defintion will make use of type variables - unspecified types in the defintions.
// The ACTUAL types you pass into the angled brackets are the types that get used
// in these defintions.
// e.g. the dfintion of mongoose.model declares that the second type argument in the <> is the type
// that mongoose.model() returns and that that type extends Model. It also says that the first type
// argument in <> is the type of the first argument passed as data into () and that it extends Document.
