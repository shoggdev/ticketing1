import Link from 'next/link';

const LandingPage = ( { currentUser, tickets } ) => {

  const ticketList = tickets.map( (ticket)=>{
    // Link href is to the file in the pages folder
    // Link as is the real url
    return (
      <tr key={ticket.id}>
        <td>{ticket.title}</td>
        <td>{ticket.price}</td>
        <td>
          <Link href="/tickets/[ticketId]" as={`/tickets/${ticket.id}`}>
            View
          </Link>
        </td>
      </tr>
    );
  });

  return (
    <div>
      <h1>Tickets</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {ticketList}
        </tbody>
      </table>
    </div>
  );
};

// getInitialProps - used during server side rendering only. Used to get data etc to enable the component to be rendered.
// It is always passed a context object that contains a number of items, including the request. This is the same kind of request object as seen in express.
LandingPage.getInitialProps = async (context, axiosClient, currentUser) => {
  // Do anything in here needed during the server side render. Such as get some data the component needs to render.
  // Can't use hooks inside here. Hooks can only be used inside a react component.

  const {data} = await axiosClient.get('/api/tickets');


  return {tickets: data}; // This will become a prop to the LandingPage component. Since we have an app component, and this getInitialProps is called from
             // the App getInitialProps, this will be returned to the App getInitialProps which then passes it into the LandingPage component as its
             // pageProps.
};

export default LandingPage;
