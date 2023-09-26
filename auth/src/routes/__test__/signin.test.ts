// Import the request faker
import request from 'supertest';
// Import the app to be tested
import { app } from '../../app';

//
it(
  'fails when an email that does not exist is supplied',   // What the test should do
  async () => {
    await request(app)                   // The app being tested and that should receive the request. Await will work instead of return too.
      .post('/api/users/signin')          // The requst type method and URL
      .send( {                            // The body of the request
        email: 'email@email.com',         // Valid email but no accounts will be in the test DB
        password: 'password'              // Valid password
      })
      .expect(400);                       // The status code that should be received in the response
  }
);

//
it(
  'fails when an inccorext password is supplied',
  async () => {

    // Create a valid account first
    await request(app)
      .post('/api/users/signup')
      .send( {
        email: 'email@email.com',
        password: 'password'
      })
      .expect(201);

    // Try to sign in
    await request(app)
      .post('/api/users/signin')
      .send( {
        email: 'email@email.com',
        password: 'password1'
      })
      .expect(400);
  }
);

//
it(
  'responds with a cookie when given valid credentials',
  async () => {

    // Create a valid account first
    await request(app)
      .post('/api/users/signup')
      .send( {
        email: 'email@email.com',
        password: 'password'
      })
      .expect(201);

    // Try to sign in
    const response = await request(app)
      .post('/api/users/signin')
      .send( {
        email: 'email@email.com',
        password: 'password'
      })
      .expect(200);

    expect(response.get('Set-Cookie')).toBeDefined();
  }
);