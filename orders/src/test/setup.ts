import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

declare global {
      var signUpAndGetCookie: () => string[];  // A cookie is a string[]
}

// List files to be imported that should be redirected to mock versions
jest.mock('../nats-wrapper');

// Global variable so that it can be access via all the hook functions in this file.
let mongo: any;

// To run before any tests start executing
beforeAll( async () => {
  // Setup environment variables
  process.env.JWT_KEY = '123';

  // Start a MongoDB instance and connect to it via the URI that gets geenrated for it
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri, {});

});

// To run before each test executes.
beforeEach( async () => {
  // Reset mock functions between tests
  jest.clearAllMocks();

  // Reset the data in the Mongo DB.
  // Delete all the collections.
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// To run after all tests have finished
afterAll( async () => {
  // Stop the mongo server and disconnect from it
  if(mongo) {
    await mongo.stop();
  }
  await mongoose.connection.close();
});

// Create a global function assigned to the global scope so that it can be accessed easily without imports from all test files.
// Because it is defined here, it'll available in the app code normally. It will only be available in the app in the test environment.
// This function will enable us to test functionality that requires the user to be authenticated. The function signs up for an account
// and allows a follow up request with the cookie to be made
global.signUpAndGetCookie = () => {
  // Build a JWT payload. { id, email }
  const payload = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com'    // something random but valid
  };

  // Create the JWT
  const token = jwt.sign(payload, process.env.JWT_KEY!);  // ! tells typescript not to worry that it might not be defined

  // Build a session object. { jwt: MY_JWT }
  const session = { jwt: token };

  // Turn the session object into JSON
  const sessionJSON = JSON.stringify(session);

  // Take the JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  // Return the base64 as string that's cookie with the encoded data. HTTP header cookie with value of session=BASE64_DATA
  return [`session=${base64}`];
};
