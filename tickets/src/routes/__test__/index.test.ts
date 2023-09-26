import request from 'supertest';
import { app } from '../../app';
//import { Ticket } from '../../models/ticket';

it('can fetch a list of tickets', async () => {
  // Create some tickets
  const title1 = 'concert1';
  const price1 = 20;
  const response1 = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signUpAndGetCookie())
    .send({
      title: title1,
      price: price1
    })
    .expect(201);

  const title2 = 'concert2';
  const price2 = 30;
  const response2 = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signUpAndGetCookie())
    .send({
      title: title2,
      price: price2
    })
    .expect(201);

  // Get the tickets
  const ticketsResponse = await request(app)
  .get('/api/tickets/')
  .send()
  .expect(200);

  expect(ticketsResponse.body.length).toEqual(2);
  expect(ticketsResponse.body[0].title).toEqual(title1);
  expect(ticketsResponse.body[0].price).toEqual(price1);
  expect(ticketsResponse.body[1].title).toEqual(title2);
  expect(ticketsResponse.body[1].price).toEqual(price2);
});