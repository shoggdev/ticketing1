import { Ticket } from '../ticket';

it('implements optimisitc concurrency control', async () => {
  // Create an instnace of a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 5,
    userId: '123'
  });

  // Save the ticket to the DB
  await ticket.save();

  // Fetch the ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  // Make a different change to each of the two copies of the ticket. Both copies should have the same version number
  firstInstance!.set({price: 10});
  secondInstance!.set({price: 15});

  // Save the first copy of ticket
  await firstInstance!.save();

  // Save the second copy of the ticket. This has a different change applied to that made to the first copy.
  // It will still have the same version number as the first copy.
  // We should therefore get an error here.
  try {
    await secondInstance!.save();
  } catch (err) {
    // We should get an error and reach this catch
    // So return making the test look like it passes.
    return;
  }

  // If we didnt get an error and enter the catch, the test failed, so throw an error.
  throw new Error('Should not reach this point.');
});

it('increments the vesion number on multiple saves', async () => {
  // Create an instnace of a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    userId: '123'
  });

  // Save the ticket to the DB
  await ticket.save();

  // The ticket should now have a version number of 0
  expect(ticket.version).toEqual(0);

  await ticket.save();
  expect(ticket.version).toEqual(1);

  await ticket.save();
  expect(ticket.version).toEqual(2);
});
