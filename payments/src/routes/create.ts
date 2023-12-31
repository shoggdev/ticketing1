import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { requireAuth, validateRequest, BadRequestError, NotFoundError, NotAuthorizedError, OrderStatus } from '@shogglearningtixcommon/common';
import { stripe } from '../stripe';
import { Order } from '../models/order';
import { Payment } from '../models/payment';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post(
  '/api/payments',
  requireAuth,
  [
    body('token').not().isEmpty().withMessage('Token is required'),
    body('orderId').not().isEmpty().withMessage('Order ID is required')
  ],
  validateRequest,
  async (req: Request, res: Response) => {

    // Find the order being paid
    const { token, orderId } = req.body;
    const order = await Order.findById(orderId);

    if(!order) {
      throw new NotFoundError();
    }

    // Check that the current user making the payment owns the order
    if(order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    // Check that the order has not been cancelled
    if(order.status === OrderStatus.Cancelled) {
      throw new BadRequestError('Order has already been cancelled. Cannot pay for a cancelled order.');
    }

    // Carry out payment for order process. Send charge to stripe.
    // TODO. Put this in a try catch block and log any errors.
    const charge = await stripe.charges.create({
      currency: 'usd',  // TODO. Accept GBP
      amount: order.price * 100, // We have been using dollars. The API wants the value in cents.
      source: token // come in on the request
    });

    // Create a payment record
    const payment = Payment.build({
      orderId: orderId,
      stripeId: charge.id // Id generated by stripe
    });
    // Save it to the DB
    await payment.save();

    // Publish an event
    // TODO we're not awaiting here so we will return a response before detecting an error like everywhere in our app
    new PaymentCreatedPublisher(natsWrapper.client).publish({
      // Use the data we just saved to fill the event to be extra safe
      id: payment.id,
      orderId: payment.orderId,
      version: payment.version,
      stripeId: payment.stripeId
    });

    res.status(201).send({
      // TODO. Don't need to return much here but think about if we need to add anything the client might need.
      id: payment.id
    });
  }
);

export { router as createChargeRouter };