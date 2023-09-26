import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { validateRequest, NotFoundError, requireAuth, NotAuthorizedError, BadRequestError } from '@shogglearningtixcommon/common';
import { Ticket } from '../models/ticket';
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.put(
  '/api/tickets/:id',
  requireAuth,
  [
    // If the following validation checks fail, they append properties onto the request object
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price').isFloat({gt: 0}).withMessage('Price must be greater than 0')
  ],
  validateRequest,
  async(req: Request, res: Response) => {
  // First check to see if the ticket exists
  const ticket = await Ticket.findById(req.params.id);   // findById is a query helper built into the model
  if(!ticket) {
    throw new NotFoundError();
  }

  // Ticket exists. Check the user is the owner
  if(ticket.userId !== req.currentUser!.id) {     // ! tells typescript that currentUser will be defined
    throw new NotAuthorizedError();
  }

  // Is the ticket reserved?
  if(ticket.orderId) {
    throw new BadRequestError('Ticket is reserved and cannot be edited.');
  }

  // User changing ticket is owner so update it.
  // Note, we are not changing the userId field here.
  ticket.set({
    title: req.body.title,
    price: req.body.price
  }); // Update the ticket in memory
  await ticket.save(); // Saves the updated ticket to the DB

  // TODO
  // Pubishing events can be improved by instead, saving the events to the microservice DB first, then having
  // a watch process look for unpublished events and publish them, rather than it being done here.
  // This improvement would require this code to first save the resource to the DB and then the event to the DB
  // too in second step / DB write.
  // To ensure both these steps were completed, the two steps should be completed inside a DB transaction.
  // This would make sure both steps complete and, if one fails, the other would be rolled back.

  // Publish ticket created event
  new TicketUpdatedPublisher(natsWrapper.client).publish({
    // Make sure to use values that were actually saved to the database rather than those in the request
    id: ticket.id,
    version: ticket.version,
    title: ticket.title,
    price: ticket.price,
    userId: ticket.userId
  });

  // Send the updated ticket back
  res.send(ticket);
});

export { router as updateTicketRouter };
