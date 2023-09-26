const OrderIndex = ({orders}) => {
  return (
    <ul>
      { orders.map(
          (order) => {
            return (
              <li key={order.id}>
                {order.ticket.title} - {order.status}
              </li>
            );
          }
      ) }
    </ul>
  );
 };

OrderIndex.getInitialProps = async (context, axiosClient) => {
  const { data } = await axiosClient.get('/api/orders');

  // Return the data that will be a prop to the OrderIndex page component
  return { orders: data };
};

export default OrderIndex;