// Import the request faker
import request from 'supertest';
// Import the app to be tested
import { app } from '../../app';

//
it(
  'responds with details about the current user',   // What the test should do
  async () => {
/*
    // Create a valid account first
    const authResponse = await request(app)
      .post('/api/users/signup')
      .send( {
        email: 'test@test.com',
        password: 'password'
      })
      .expect(201);

    // Grab the cookie received in the response to the first request
    const cookie = authResponse.get('Set-Cookie');
*/
    const cookie = await global.signUpAndGetCookie();

    const response = await request(app)
      .get('/api/users/currentuser')
      .set('Cookie', cookie)   // Include the auth cookie received in previous request-response
      .send()
      .expect(400);
    
    expect(response.body.currentUser.email).toEqual('test@test.com');
  }
);

//
it(
  'responds with currentUser of null is not authenticated',   // What the test should do
  async () => {
    const response = await request(app)
      .get('/api/users/currentuser')
      .send()
      .expect(200);
    
    expect(response.body.currentUser).toEqual(null);
  }
);