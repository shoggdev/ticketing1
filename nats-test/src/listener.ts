import nats, { Message, Stan } from 'node-nats-streaming';
import { randomBytes } from 'crypto';
import { TicketCreatedListener } from './events/ticket-created-listener';

console.clear();

const clientId = randomBytes(4).toString('hex');
const stan = nats.connect('ticketing', clientId, { url: 'http://localhost:4222' });

stan.on('connect', () => {
  console.log('Listener connected to NATS');

  // setup up graceful shutdown. When the NATS client is about to be closed, tell the NATS server
  // so that it knows the client will be gone and to not send it any more events.
  // This should fire after the stan.close() calls in the signal handlers at the bottom of this file.
  stan.on('close', () => {
    console.log('NATS connection closed!');
    process.exit();
  });

  new TicketCreatedListener(stan).listen();
});

// Handlers to watch for interrupt signals or termiante signals when the process is closed
process.on('SIGINT', () => stan.close());
process.on('SIGTERM', () => stan.close());


