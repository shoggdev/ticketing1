import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session'
import { errorHandler, NotFoundError, currentUser } from '@shogglearningtixcommon/common';
import { createChargeRouter } from './routes/create';

const app = express();
app.set('trust proxy', true);  // Trust traffic that is proxied through ingress-inginx
app.use( json() );

// Setup the cookie support as middleware. This adds req.session to the session object.
// Any info we store on this object will be serialized and stored in the cookie.
app.use(
  cookieSession({
    signed: false,  // Don't need to encrpyt the cookies as the JWT token will already be encrypted
    secure: process.env.NODE_ENV !== 'test' // true // Cookies will only be used if the user is accessing app over a HTTPS connection
  })
);

// Look for a JWT auth token on every incoming request, decode it if present and add the current user to the incoming request object.
// It will then be avaialble for use further into processing the request, such as for checking if the user is authenticated.
app.use(currentUser);

app.use(createChargeRouter);

app.all('*', async () => {
  throw new NotFoundError();
});

// For synchonous functions called at the routes so far, express will automatically catch any thrown errors
// and call the error handler in the following middle ware as it has 4 arguments.
app.use(errorHandler);

export { app };
