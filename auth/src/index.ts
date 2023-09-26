import mongoose from 'mongoose';
import {app} from './app';

const start = async () => {
  // Checking that the environment variables we rely on are defined.
  if(!process.env.JWT_KEY) {
    throw new Error('ERROR: Enviroment variable JWT_KEY not defined.');
  }
  if(!process.env.MONGO_URI) {
    throw new Error('ERROR: Enviroment variable MONGO_URI not defined.');
  }

  try {
    // The domain name to connect to is defined by the cluster ip service for the pongo pod
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Auth service connected to MongoDB');
  } catch (err) {
    console.error(err);
  }

  app.listen(3000, () => {
    console.log('Auth service listening on port 3000!!');
  });
};

start();
