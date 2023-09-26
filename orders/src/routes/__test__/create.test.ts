import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper'; // Mocked out using the fake implemenation in __mocks__

// TODO. Add similar tests that were written for the tickets service to check for
// authentication and validation.

it('returns and error if the ticket does not exist', async () => {
  const ticketId = new mongoose.Types.ObjectId();

  await request(app)
  .post('/api/order')
  .set('Cookie', global.signUpAndGetCookie())
  .send({ ticketId: ticketId })
  .expect(404);
});

// Reserved === a not cancelled order already exists for the ticket
it('returns and error if the ticket is already reserved', async () => {
  // create a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  });
  await ticket.save();

  // Create an order assocaited with the ticket
  const order = Order.build({
    ticket: ticket,
    userId: 'AABBCC',
    status: OrderStatus.Created,
    expiresAt: new Date() // Expired order doesnt matter
  });
  await order.save();

  // Try and create an order for a ticket when an uncancelled order containing the
  // same ticket already exists
  const response = await request(app)
    .post('/api/orders')
    .set('Cookie', global.signUpAndGetCookie())
    .send({ticketId: ticket.id})
    .expect(400);

  expect(response.body.errors[0].message).toEqual('Ticket is already reserved');
});

it('reserves a ticket', async () => {
  // create a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  });
  await ticket.save();

  // Try and create an order for the ticket when no uncancelled order containing the
  // same ticket already exists
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signUpAndGetCookie())
    .send({ticketId: ticket.id})
    .expect(201);

  // TODO check the database contents
  // maybe read the order back etc.
});

it('emits an order created event', async () => {
  // create a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  });
  await ticket.save();

  // Try and create an order for the ticket when no uncancelled order containing the
  // same ticket already exists
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signUpAndGetCookie())
    .send({ticketId: ticket.id})
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});