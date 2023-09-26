// Import the request faker
import request from 'supertest';
// Import the app to be tested
import { app } from '../../app';

// A test
it(
  'returns a 201 on successful signup',   // What the test should do
  async () => {
    return request(app)                   // The app being tested and that should receive the request. Await will work instead of return too.
      .post('/api/users/signup')          // The requst type method and URL
      .send( {                            // The body of the request
        email: 'email@email.com',
        password: 'password'
      })
      .expect(201);                       // The status code that should be received in the response
  }
);

it(
  'returns a 400 with an invalid email',
  async () => {
    return request(app)
      .post('/api/users/signup')
      .send( {
        email: 'email@emailcom',
        password: 'password'
      })
      .expect(400);                       
  }
);

it(
  'returns a 400 with an invalid password',
  async () => {
    return request(app)
      .post('/api/users/signup')
      .send( {
        email: 'email@email.com',
        password: 'p'
      })
      .expect(400);
  }
);

it(
  'returns a 400 with missing email and password',
  async () => {
    return request(app)
      .post('/api/users/signup')
      .send( {
      })
      .expect(400);
  }
);


// Two requests in one test
it(
  'returns a 400 with missing password and then missing email',
  async () => {
    await request(app)
      .post('/api/users/signup')
      .send( {
        email: 'email@email.com'
      })
      .expect(400);

    return request(app)
      .post('/api/users/signup')
      .send( {
        password: 'password'
      })
      .expect(400);
  }
);

it(
  'disallows duplicate emails',
  async () => {
    await request(app)
      .post('/api/users/signup')
      .send( {
        email: 'email@email.com',
        password: 'password'
      })
      .expect(201);

    return request(app)
      .post('/api/users/signup')
      .send( {
        email: 'email@email.com',
        password: 'password'
      })
      .expect(400);
  }
);

it(
  'sets a cookie after successful signup',
  async () => {
    const response = await request(app)
      .post('/api/users/signup')
      .send( {
        email: 'email@email.com',
        password: 'password'
      })
      .expect(201);

    expect(response.get('Set-Cookie')).toBeDefined();
  }
);