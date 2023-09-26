// Import the request faker
import request from 'supertest';
// Import the app to be tested
import { app } from '../../app';

//
it(
  'clears the cookie after signing out',   // What the test should do
  async () => {

    // Create a valid account first
    await request(app)
      .post('/api/users/signup')
      .send( {
        email: 'email@email.com',
        password: 'password'
      })
      .expect(201);

    // Try to sign out
    const response = await request(app)
      .post('/api/users/signout')
      .send( {})
      .expect(200);

    //console.log( response.get('Set-Cookie') );
    expect(response.get('Set-Cookie')[0]).toEqual('session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly');
  }
);
