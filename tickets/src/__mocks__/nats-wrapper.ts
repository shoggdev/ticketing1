// Fake implementation of nats-wrapper for JEST testing

export const natsWrapper = {
  client: {
    /*
    publish: (subject: string, data: string, callback: () => void) => {
      callback();
    },
    */

    // Returns a new function and assigns it to the property publish.
    // It can be called from anything and internally, it will keep track of
    // whether it has been called, what arguments it was provided etc
    // So that expectations / tests can be made of it.
    publish: jest
      .fn()
      .mockImplementation(
        (subject: string, data:string, callback: ()=> void) => {
          // This is what gets executed when publish is called
          callback();
        }
      )
  }
};
