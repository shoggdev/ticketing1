import mongoose from 'mongoose';
import { app } from './app';
import { natsWrapper } from './nats-wrapper';
import { OrderCreatedListener } from './events/listeners/order-created-listener';     // Needed to reserve tickets
import { OrderCancelledListener } from './events/listeners/order-cancelled-listener'; // Needed to unreserve tickets

const start = async () => {
  console.log('Tickets service starting...');

  // Checking that the environment variables we rely on are defined.
  if(!process.env.JWT_KEY) {
    throw new Error('ERROR: Environment variable JWT_KEY not defined.');
  }
  if(!process.env.MONGO_URI) {
    throw new Error('ERROR: Environment variable MONGO_URI not defined.');
  }
  if(!process.env.NATS_CLIENT_ID) {
    throw new Error('ERROR: Environment variable NATS_CLIENT_ID not defined.');
  }
  if(!process.env.NATS_URL) {
    throw new Error('ERROR: Environment variable NATS_URL not defined.');
  }
  if(!process.env.NATS_CLUSTER_ID) {
    throw new Error('ERROR: Environment variable NATS_CLUSTER_ID not defined.');
  }

  try {
    // Connect to the NATS message broker
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,  // Cluster Id defined in the NATS cluster deployment file
      process.env.NATS_CLIENT_ID,   // Client ID, should be a random value
      process.env.NATS_URL          // URL should be the URL of the service governing access to the NATS pod 
    );
    // Setup up graceful shutdown. When the NATS client is about to be closed, tell the NATS server
    // so that it knows the client will be gone and to not send it any more events.
    // This should fire after the stan.close() calls in the signal handlers at the bottom of this file.
    natsWrapper.client.on('close', () => {
      console.log('NATS connection closed!');
      process.exit();
    });
    // Handlers to watch for interrupt signals or terminate signals when the process is closed
    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());

    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderCancelledListener(natsWrapper.client).listen();

    // The domain name to connect to is defined by the cluster ip service for the pongo pod
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Tickets service connected to MongoDB');
  } catch (err) {
    console.error(err);
  }

  app.listen(3000, () => {
    console.log('Tickets service listening on port 3000!!');
  });
};

start();

