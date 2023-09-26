import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

// An interface that describes the properties that are required to create a new ticket
// This is used to enforce the types and fields required to pass into the custom build
// method implemented blow.
interface TicketAttrs {
  title: string;        // Type for typescript
  price: number;
  userId: string;
}

// An interface that describes the properties that a Ticket DOCUMENT has. This is used
// to tell typescript that the properties read out of a Ticket DOCUMENT are different and a superset
// of those used to create the document through the model.
// This interface will allow us to safely, in typescript, access properties using
// syntax like ticketInstance.title and ticketInstance.price
interface TicketDoc extends mongoose.Document {
  // These are properties that are in addition to those on the base Document
  title: string;    // Type for typescript
  price: number;
  userId: string;
  version: number; // We need to add this here so that it is now part of the TicketDoc defintion.
                  // The definition would otherwise only know about the field called __v
                   // We specify below that we will use this as the version field name and not __v
  orderId?: string // Set when the ticket gets reserved by an order. Indicates the ticket is reserved.
                   // The ? tells typescript that it is an optional field.
  // We could add createdAt and updatedAt if mongoose added these and we want them.
};

// An interface that describes the properties that a Ticket model has.
// This is needed to tell typescript about the custom static functions like build(),
// that have been added.
// See below for angled brackets notes.
interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc; // Specifying that this will return an instance of TicketDoc
}

// The type infomation in the ticket schema is not typescript. This is mongoose stuff.
// Also note that the string type in typescript is lowercase 's' too.
const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,   // Actual type used by mongoose, not typescript.
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    orderId: {          // This is set when an order reserves the ticket.
      type: String
      // Not required because it is only set when the ticket is reserved.
    }
  },
  {
    // This will describe to mongoose how to take the ticket document and turn it into JSON.
    // We can use this here to transform the document into a form appropriate for sending back to the
    // API client. Such as normalize the id field name and remove fields we want to hide.
    // Command-click on toJSON to see more info on how to use it.
    toJSON:
    {
      transform(doc, ret) {
        // rename _id to id as it is mongodb specific
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

// Override the default document version field name from __v to version
ticketSchema.set('versionKey', 'version');

// Update support for optimistic concurreny control plugin
ticketSchema.plugin(updateIfCurrentPlugin);

// Use this custom static function build() to create a new Ticket document instead of using new Ticket()
// This will enable us to use typescript type checking by enforcing use of the TicketAttrs interface
ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket(attrs);
};

// See below for angled brackets nots.
const Ticket = mongoose.model<TicketDoc, TicketModel>(
  'Ticket',       // Name of the collection
  ticketSchema);

export { Ticket };

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
