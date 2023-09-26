import mongoose from "mongoose";
import request from "supertest";
import { app } from "../../app";
import { Ticket } from "../../models/ticket";
import { Order, OrderStatus } from "../../models/order";
import { natsWrapper } from "../../nats-wrapper";

// TODO Add test for invalid order ids being supplied including those that dont exist
// TODO Add a test to make sure user is authenticated
// TODO Add a test to make sure there is an error if a user tries to delete and order that isnt theirs

it('marks an order as cancelled', async () => {
  // Create a ticket with Ticker model
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  });
  await ticket.save();

  // Create a sign in user cokkie
  const userCookie = global.signUpAndGetCookie();

  // Make a request to create an order
  const { body: order } = await request(app)  // destrcuture body from response and rename to order
    .post('/api/orders')
    .set('Cookie', userCookie)
    .send({ticketId: ticket.id})
    .expect(201);

  // Make a request to cancel the order
  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', userCookie) 
    .send()
    .expect(204);

  // Expectation to make sure the order was cancelled.
  const updatedOrder = await Order.findById(order.id);

  // If the order isnt found, the test will fail as we want it to.
  // So it's safe to tell TS that it will be defined if we get this far.
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('emits an order cancelled event', async () => {
  // Create a ticket with Ticker model
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20
  });
  await ticket.save();

  // Create a sign in user cokkie
  const userCookie = global.signUpAndGetCookie();

  // Make a request to create an order
  const { body: order } = await request(app)  // destrcuture body from response and rename to order
    .post('/api/orders')
    .set('Cookie', userCookie)
    .send({ticketId: ticket.id})
    .expect(201);

  // Make a request to cancel the order
  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', userCookie) 
    .send()
    .expect(204);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
