import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';
import { OrderStatus } from '@shogglearningtixcommon/common';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payment';

// Only needed if we want to test using a mocked version of stripe.
// jest.mock('../../stripe');

it('returns a 404 when purchasing and order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signUpAndGetCookie())
    .send({
      token: 'random-doesnt-matter',
      orderId: new mongoose.Types.ObjectId().toHexString()
    })
    .expect(404);
});

it('returns a 401 when purshasing an order that doesnt belong to the user', async () => {
  // Create a fake order that we want to pay for
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),  // A different ID to the current user
    version: 0,
    price: 20,
    status: OrderStatus.Created
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signUpAndGetCookie())
    .send({
      token: 'random-doesnt-matter',
      orderId: order.id
    })
    .expect(401);
});

it('returns a 400 when purchasing a cancelled order', async () => {
  // Create a userId to create and order and a cookie for that user
  const userId = new mongoose.Types.ObjectId().toHexString();

  // Create a fake order that we want to pay for with the usrId
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    version: 0,
    price: 20,
    status: OrderStatus.Cancelled  // We want it to be cancelled
  });
  await order.save();

  // Send the request to pay using a cookie generated from the same userId
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signUpAndGetCookie(userId)) // Same user as the order was created for
    .send({
      token: 'random-doesnt-matter',
      orderId: order.id
    })
    .expect(400);
});

it('returns a 201 with valid inputs', async () => {
  // Create a userId to create and order and a cookie for that user
  const userId = new mongoose.Types.ObjectId().toHexString();
  const price = Math.floor(Math.random() * 100000);

  // Create a fake order that we want to pay for with the usrId
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    version: 0,
    price: price,
    status: OrderStatus.Created  // We want to be able to pay for it
  });
  await order.save();

  // Make a request to pay for the order

  const response = await request(app)
    .post('/api/payments')
    .set('Cookie', global.signUpAndGetCookie(userId)) // Same user as the order was created for
    .send({
      token: 'tok_visa',
      orderId: order.id
    })
    .expect(201);

  /*
  // Expectation if using a mocked stripe library
  // [0] first time it was called [0] first argument
  const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
  expect(chargeOptions.source).toEqual('tok_visa');
  expect(chargeOptions.amount).toEqual(20*100);
  expect(chargeOptions.currency).toEqual('usd');
  */
  // Call the stripe APi and check the charge that was made
  // limit is the number of most recent charges to pull. Only need to increase this is we run multiple copies of the test suite.
  const stripeCharges = await stripe.charges.list({limit: 1});

  // look for the charge in the list of charges retrieved.
  const stripeCharge = stripeCharges.data.find( (charge) => {
    // Call this function on each charge in stripeCharges.data
    // Look for a charge with the correct amount in cents and return true if found
    return charge.amount === price*100;
  });

  expect(stripeCharge).toBeDefined(); // Specifically looks for the value 'undefined'
  expect(stripeCharge!.currency).toEqual('usd');

  // Check that the payment was saved in the DB
  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id  // Stripe generated id
  });

  // Payment might be null so we cant use toBeDefined here.
  expect(payment).not.toBeNull();

  // Check the request response body contained the same payment id as the one saved to the DB
  expect(response.body.id).toEqual(payment!.id);
});