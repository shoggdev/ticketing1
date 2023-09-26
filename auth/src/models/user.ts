import mongoose from 'mongoose';
import { Password } from '../services/password';

// An interface that describes the properties that are required to create a new user
// This is used to enforce the types and fields required to pass into the custom build
// method implemented blow.
interface UserAttrs {
  email: string;        // Type for typescript
  password: string;
}

// An interface that describes the properties that a User model has.
// This is needed to tell typescript about the custom static functions like build(),
// that have been added.
// See below for angled brackets notes.
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc; // Specifying that this will return an instance of UserDoc
}

// An interface that describes the properties that a User DOCUMENT has. This is used
// to tell typescript that the properties read out of a User DOCUMENT are different and a superset
// of those used to create the document through the model.
// This interface will allow us to safely, in typescript, access properties using
// syntax like userInstance.email and userInstance.password
interface UserDoc extends mongoose.Document {
  // These are properties that are in addition to those on the base Document
  email: string;     // Type for typescript
  password: string;
  // We could add createdAt and updatedAt if mongoose added these and we want them.
};

// The type infomation in the user schema is not typescript. This is mongoose stuff.
// Also note that the string type in typescript is lowercase 's' too.
const userSchema = new mongoose.Schema(
{
  email: {
    type: String,     // Actual type used by mongoose, not typescript.
    required: true
  },
  password: {
    type: String,
    required: true
  }
},
{
  // This will describe to mongoose how to take the user document and turn it into JSON.
  // We can use this here to transform the document into a form appropriate for sending back to the
  // API client. Such as normalize the id field name and remove fields we want to hide.
  // Command-click on toJSON to see more info on how to use it.
  toJSON:
  {
    transform(doc, ret) {
      // rename _id to id as it is mongodb specific
      ret.id = ret._id;
      delete ret._id;
      delete ret.password;
      delete ret.__v;
    }
  }
});

// This will run just before the save() method on the model is executed.
// This will hash the password
userSchema.pre('save', async function (done) {
  // Mongoose is proeply async compatible. So after we have finished, we need to call done() to
  // let mongoose know we have finished the pre() hook.

  // We also used a standard function rather than an arrow function. When we use a middleware function
  // this refers to the Document being saved - the User - inside this function. If we used an arrow function
  // then the value of this would be overidden and be equal to the context of this entire source file.

  // Now check to see if password has been modified. We might be trying to retrieve the user from the DB
  // and then save it back updated to the DB. We don't want to re-hash an already hashed password if
  // we are not saving a new one.
  if(this.isModified('password')) {
    // This only runs if we are chaning the password. Password is considered to be modified by mongoose
    // when it is first created via the build() method.
    const hashed = await Password.toHash(this.get('password'));
    // Replace the provided password with the hashed version before the save
    this.set('password', hashed);
  }

  done(); 
});

// Use this custom static function build() to create a new User document instead of using new User()
// This will enable us to use typescript type checking by enforcing use of the UserAttrs interface
userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

// See below for angled brackets nots.
const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };


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
