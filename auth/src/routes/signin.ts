import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { validateRequest, BadRequestError } from '@shogglearningtixcommon/common';
import { User } from '../models/user';
import { Password } from '../services/password';

const router = express.Router();

router.post('/api/users/signin',
[
  // If the following validation checks fail, they append properties onto the request object
  body('email').isEmail().withMessage('Email must be valid'),
  // Dont check for password length rules because they might change overtime and users
  // that have no updated their password with the new rules will be locked out.
  body('password').trim().notEmpty().withMessage('You must supply a password')
],
validateRequest,
async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Query database to see if the user exists
  const existingUser = await User.findOne({ email });
  if(!existingUser) {
    // User does not exist. Don't give too much info in the error message.
    throw new BadRequestError('Invalid credentials');
  }

  // Compare passwords
  const passwordsMatch = await Password.compare(existingUser.password, password);
  if(!passwordsMatch) {
    throw new BadRequestError('Invalid credentials');
  }
  
    // Now auto log the user in by creating a JWT.
    // Include the data that should be in the token as the payload to jwt.sign().
    // TODO consider what we want to put in the JWT
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email
      },
      process.env.JWT_KEY! // The ! keeps typescript from complaining that the env variable might not be defined
    );
    // Put the token on the session
    // Becase typescript wont recognise the properties we want to add to the session object,
    // we get around it by redefining the object
    req.session = {
      jwt: userJwt
    };
    // The cookie-session library will now serialise this object and send it back to the users browser.

    // Send general OK response
    return res.status(200).send(existingUser);
});

export { router as signinRouter };