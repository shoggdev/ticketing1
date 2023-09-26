import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import { requireAuth, validateRequest, NotFoundError, BadRequestError } from '@shogglearningtixcommon/common';
import { body } from 'express-validator';
import { Ticket } from '../models/ticket';
import { Order, OrderStatus } from '../models/order';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

// TODO use an env variable or make it settable by an admin?
const EXPIRATION_WINDOW_SECONDS = 1 * 20;  // Tickets should expire after 15 mins

router.post('/api/orders',
  requireAuth,
  [
    // If the following validation checks fail, they append properties onto the request object
    body('ticketId').not().isEmpty().withMessage('TicketId must be provided'),
    body('ticketId').isMongoId().withMessage('TicketId must be valid Id'),
/*
      .custom((input: string)=>{
        // This customer check adds coupling between this micro serice and the tickets microservice.
        // It requires the ticketId to be a valid mongo id, so we are making use of knowledge about the implementation
        // of another micro service here.
        mongoose.Types.ObjectId.isValid(input)
      })
*/
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } = req.body;

    // Find the ticket the user is trying to order in the DB
    const ticket = await Ticket.findById(ticketId);
    if(!ticket) {
      throw new NotFoundError();
    }

    // Make sure that this ticket is not already reserved. To do this,
    const isReserved = await ticket.isReserved();
    if(isReserved) {
      throw new BadRequestError('Ticket is already reserved');
    }

    // Calculate an expiration date for this order
    const expiration = new Date();  // Get time of right now
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS); // Add the expiration time

    // Build the order and save it to the database
    const order = Order.build({
      userId: req.currentUser!.id,   // ! tells TS this will be defined due to enforced auth
      status: OrderStatus.Created,
      expiresAt: expiration, // Mongoose converts this to a string before writing it to the DB
      ticket: ticket
    });
    await order.save();

    // Publish an event saying that an order was created
    new OrderCreatedPublisher(natsWrapper.client).publish({
      id: order.id,
      version: order.version,
      status: order.status,
      userId: order.userId,
      // order.expiresAt in this code will be a date object. The object being put into this event will eventually be turned into JSON.
      // When a data object gets turned into JSON, it usually ges converted into the format for the current timezone it is running in.
      // So we need to convert it now in a timezone agnsotic format: UTC.
      expiresAt: order.expiresAt.toISOString(),
      ticket: {
        id: ticket.id,
        price: ticket.price
      }
    });

    res.status(201).send(order)
  }
);

export { router as createOrderRouter };