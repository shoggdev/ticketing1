import express, { Request, Response } from 'express';
import { param } from 'express-validator';
import { NotAuthorizedError, NotFoundError, requireAuth, validateRequest } from '@shogglearningtixcommon/common';
import { Order } from '../models/order';

const router = express.Router();

router.get('/api/orders/:orderId',
  requireAuth,
  [
    // If the following validation checks fail, they append properties onto the request object
    param('orderId').isMongoId().withMessage('Order Id must be valid Id'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const order = await Order.findById(req.params.orderId).populate('ticket');
    if(!order) {
      throw new NotFoundError();
    }
  
    if(order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    res.send(order)
  }
);

export { router as showOrderRouter };