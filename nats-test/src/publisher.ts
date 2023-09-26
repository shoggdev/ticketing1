import nats from 'node-nats-streaming';
import { TicketCreatedPublisher } from './events/ticket-created-publisher';

console.clear();

const stan = nats.connect('ticketing', 'abc', { url: 'http://localhost:4222' });

stan.on('connect', async () => {
  console.log('Publisher connected to NATS');

  const publisher = new TicketCreatedPublisher(stan);
  try{
    await publisher.publish({
      id: '123',
      title: 'concert',
      price: 20
    });
  } catch (err) {

  }

/*
  const data = {
    id: '123',
    title: 'concert',
    price: 20
  };

  // Need to convert data object to JSON before sending it to NATS
  const jsonData = JSON.stringify(data);

  stan.publish(
    'ticket:created',   // Name of channel/subject to publish to
    jsonData,           // Data to send
    () => {             // Optional callback to be invoked once publish completed
      console.log('Event published');
    });
*/  
});
