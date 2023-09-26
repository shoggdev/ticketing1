import express, { Request, Response } from 'express';
import { param } from 'express-validator';
import { Ticket } from '../models/ticket'
import { validateRequest } from '@shogglearningtixcommon/common';
import { NotFoundError } from '@shogglearningtixcommon/common';

const router = express.Router();

router.get('/api/tickets/:id',
  [
    //  // If the following validation checks fail, they append properties onto the request object
    param('id').isMongoId().withMessage('Ticket ID must be a valid Id')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id);   // findById is a query helper built into the model
    if(!ticket) {
      throw new NotFoundError();
    }

    res.send(ticket);   // No status code specified so defaults to 200
  }
);

export { router as showTicketRouter };
