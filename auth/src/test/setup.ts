import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app';

declare global {
      var signUpAndGetCookie: () => Promise<string[]>;  // A cookie is a string[]
}

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
global.signUpAndGetCookie = async () => {
  const email = 'test@test.com';
  const password = 'password';

  const response = await request(app)
  .post('/api/users/signup')
  .send({
    email,
    password
  })
  .expect(201);

  const cookie = response.get('Set-Cookie');

  return cookie;
};