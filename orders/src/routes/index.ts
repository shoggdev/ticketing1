import express, { Request, Response } from 'express';
import { requireAuth } from '@shogglearningtixcommon/common';
import { Order } from '../models/order';

const router = express.Router();

router.get('/api/orders',
  requireAuth,
  async (req: Request, res: Response) => {
    const orders = await Order.find({
      // requireAuth should add the current user to the request
      userId: req.currentUser!.id   // ! to keep TS happy
    }).populate('ticket');

    res.send(orders);
  }
);

export { router as indexOrderRouter };