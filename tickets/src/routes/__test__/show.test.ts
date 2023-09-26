import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';

it('returns a 404 if the ticket is not found', async () => {
  const exampleId = new mongoose.Types.ObjectId().toHexString();
  await request(app)
  .get(`/api/tickets/${exampleId}`)
  .send()
  .expect(404);

  // TODO currently return 500 is a non valid id is passed in and obviously not found. Should be 404...?
  // maybe put id validation in the route handler: param('id').isMongoId().withMessage...
});

it('returns the ticket if the ticket is found', async () => {
  // Create a ticket
  const title = 'concert';
  const price = 20;

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signUpAndGetCookie())
    .send({
      title: title,
      price: price
    })
    .expect(201);
  
  // Get the ticket
  const ticketResponse = await request(app)
  .get(`/api/tickets/${response.body.id}`)
  .send()
  .expect(200);

  expect(ticketResponse.body.title).toEqual(title);
  expect(ticketResponse.body.price).toEqual(price);
});