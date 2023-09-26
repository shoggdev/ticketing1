import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';
import { Ticket } from '../../models/ticket';

// TODO test invalid requests such as invalid order if in request param

it('fetches the order', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  });
  await ticket.save();

  // Get a user cookie
  const userCookie = global.signUpAndGetCookie();

  // Make a request to build an order with this ticket
  const { body: order } = await request(app)   // destrcuture body from response and rename it to order
    .post('/api/orders')
    .set('Cookie', userCookie)
    .send({ticketId: ticket.id})
    .expect(201);

  // Make a request to fetch the order
  const { body: fetchedOrder } = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', userCookie)
    .send()
    .expect(200);

  expect(fetchedOrder.id).toEqual(order.id);
});

it('returns an error if one user tries to fetch another users order', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  });
  await ticket.save();

  // Get two different user cookies
  const userOneCookie = global.signUpAndGetCookie();
  const userTwoCookie = global.signUpAndGetCookie();

  // Make a request to build an order with this ticket and the first user cookie
  const { body: order } = await request(app)   // destrcuture body from response and rename it to order
    .post('/api/orders')
    .set('Cookie', userOneCookie)
    .send({ticketId: ticket.id})
    .expect(201);

  // Make a request to fetch the order using the second user cookie
  await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', userTwoCookie)
    .send()
    .expect(401);
});