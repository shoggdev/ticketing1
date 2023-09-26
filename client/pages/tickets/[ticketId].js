import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const TicketShow = ({ticket}) => {

  const { doRequest, jsxErrors} = useRequest({
    url: '/api/orders',
    method: 'post',
    body: {
      ticketId: ticket.id
    },
    onSuccess: (order) => {
      // First arg is to the file in the pages folder
      // Second arg is the real URL
      Router.push(
        '/orders/[orderId]',
        `/orders/${order.id}`);
    }
  });

  // Wrap the doRequest below in an arrow function, otherwise it will be given the onClick event as a prop.
  return (
    <div>
      <h1>{ticket.title}</h1>
      <h4>Price: {ticket.price}</h4>
      {jsxErrors}
      <button
        className="btn btn-primary"
        onClick={ ()=>doRequest() }>
          Purchase
      </button>
    </div>
  );
};

TicketShow.getInitialProps = async (context, axiosClient) => {
  const { ticketId } = context.query; // query is the URL query string

  // Get the specific ticket data
  const {data} = await axiosClient.get(`/api/tickets/${ticketId}`);

  // Return data that should be received by the page component.
  return { ticket: data };
};

export default TicketShow;