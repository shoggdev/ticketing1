import express from 'express';
import { currentUser } from '@shogglearningtixcommon/common';

const router = express.Router();

// This route allows the client to determine if the user is logged in
router.get( '/api/users/currentuser',
            currentUser,  // Get the current user from the JWT if there is one
            (req, res) => {
  // Send the contents of the JWT if it was present in the request.
  // If the JWT was not found, verified and extracted OK, req.currentUser will be undefined.
  res.send({ currentUser: req.currentUser || null });
});

export { router as currentUserRouter };