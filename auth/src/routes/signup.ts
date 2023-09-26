import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { validateRequest, BadRequestError } from '@shogglearningtixcommon/common';
import { User } from '../models/user';

const router = express.Router();

router.post('/api/users/signup',
  [
    // If the following validation checks fail, they append properties onto the request object
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').trim().isLength({ min: 4, max: 20 }).withMessage('Password must be between 4 and 20 characters')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if(existingUser) {
      // User already exists
      throw new BadRequestError('Email in use');
    }

    // Create the user using the custom static function on User that enforces the type
    const user = User.build({email, password});
    await user.save();

    // Now auto log the user in by creating a JWT.
    // Include the data that should be in the token as the payload to jwt.sign().
   // TODO consider what we want to put in the JWT
    const userJwt = jwt.sign(
      {
        id: user.id,
        email: user.email
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
    // The whole session object gets serialised and sent back. i.e. it gets turned into a JSON and
    // then base64 encoded. The contents of the cookie can be decoded backinto the json object by
    // by anyone at www.base64decode.org.
    // The JWT in this JSON can be decoded at www.jwt.io. This tool can also be used to verify
    // a token if the orignal secret signing key (which we would have in an ENV variable)
    // is also provided.
  

    // Send resource successfully created response
    return res.status(201).send(user);
});

export { router as signupRouter };
