import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';

it('returns a 404 if the provided id does not exist', async () => {
  const exampleId = new mongoose.Types.ObjectId().toHexString();
  const title = 'concert'
  const price = 20;
  await request(app)
    .put(`/api/tickets/${exampleId}`)
    .set('Cookie', global.signUpAndGetCookie())
    .send({
      title: title,
      price: price
    })
    .expect(404);
  
    // TODO Test what happens when a non valid id is supplied.
});

it('returns a 401 if the user is not authenticated', async () => {
  const exampleId = new mongoose.Types.ObjectId().toHexString();
  const title = 'concert'
  const price = 20;
  await request(app)
    .put(`/api/tickets/${exampleId}`)
    .send({
      title: title,
      price: price
    })
    .expect(401);
});

it('returns a 401 if the user does not own the ticket', async () => {
  // Create a ticket
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signUpAndGetCookie())   // The ticket will be created using the userId generated in here
    .send({
      title: 'AABBCCDD',
      price: 20
    })
    .expect(201);

  // Try to update the ticket just created
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', global.signUpAndGetCookie())   // Generates a new cookie with a new and different userId from the first request
    .send({
      title: 'a new title',
      price: 1000
    })
    .expect(401);

  // TODO maybe test that the ticket db record was indeed not changed.
});

it('returns a 400 if the user provides an invalid title or price', async () => {
  
  // Get a cookie so that multiple requests as the same user can be made
  const cookie = global.signUpAndGetCookie();
  
  // Create a ticket
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'AABBCCDD',
      price: 20
    })
    .expect(201);

  // Try to update the ticket with invalid title
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: '',
      price: 20
    })
    .expect(400);

  // Try to update the ticket with missing title
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      price: 20
    })
    .expect(400);

  // Try to update the ticket with invalid price
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'A new title',
      price: -10
    })
    .expect(400);

    // Try to update the ticket with a missing price
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'A new title',
    })
    .expect(400);

});

it('updates the ticket provided valid inputs', async () => {
  // Get a cookie so that multiple requests as the same user can be made
  const cookie = global.signUpAndGetCookie();
  
  // Create a ticket
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'AABBCCDD',
      price: 20
    })
    .expect(201);

  // TODO Check the ticket inital values are in the DB

  // Try to update the ticket with valid title
  const newTitle = 'A new title';
  const newPrice = 100;
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: newTitle,
      price: newPrice
    })
    .expect(200);

  // Read the ticket back and check it
  const ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect(200);
  expect(ticketResponse.body.title).toEqual(newTitle);
  expect(ticketResponse.body.price).toEqual(newPrice);

  // TODO Check the ticket was modified in the DB

});

it('publishes an event', async () => {
  // Get a cookie so that multiple requests as the same user can be made
  const cookie = global.signUpAndGetCookie();
  
  // Create a ticket
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'AABBCCDD',
      price: 20
    })
    .expect(201);

  // TODO Check the ticket inital values are in the DB

  // Try to update the ticket with valid title
  const newTitle = 'A new title';
  const newPrice = 100;
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: newTitle,
      price: newPrice
    })
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('returns an error if the ticket is reserved', async () => {
  // Get a cookie so that multiple requests as the same user can be made
  const cookie = global.signUpAndGetCookie();
  
  // Create a ticket
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'AABBCCDD',
      price: 20
    })
    .expect(201);

  // TODO Check the ticket inital values are in the DB

  // Set the ticket to reserved
  const ticket = await Ticket.findById(response.body.id);
  ticket!.set({ orderId: new mongoose.Types.ObjectId().toHexString() });
  await ticket!.save();

  // Try to update the ticket with valid title
  const newTitle = 'A new title';
  const newPrice = 100;
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: newTitle,
      price: newPrice
    })
    .expect(400);
});