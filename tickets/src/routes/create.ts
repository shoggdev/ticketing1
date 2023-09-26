import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { requireAuth, validateRequest } from '@shogglearningtixcommon/common';
import { Ticket } from '../models/ticket'
import { TicketCreatedPublisher } from '../events/publishers/ticket-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post('/api/tickets',
  requireAuth,
  [
    // If the following validation checks fail, they append properties onto the request object
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price').isFloat({gt: 0}).withMessage('Price must be greater than 0')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const  {title, price } = req.body;

    const ticket = Ticket.build({
      title: title,
      price: price,
      userId: req.currentUser!.id   // ! tells typescript that currentUser will be defined
    });

    await ticket.save();

    // Publish ticket created event
    await new TicketCreatedPublisher(natsWrapper.client).publish({
      // Make sure to use values that were actualyl saved to the database rather than those in the request
      id: ticket.id,              // Generated when ticket was saved
      version: ticket.version,    // Generated when ticket was saved
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId
    });

    res.status(201).send(ticket)
  }
);

export { router as createTicketRouter };
