import { useEffect, useState } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import useRequest from '../../hooks/use-request';
import Router from 'next/router';

const OrderShow = ({order, currentUser}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  const {doRequest, jsxErrors} = useRequest({
    url: '/api/payments',
    method: 'post',
    body: {
      orderId: order.id
    },
    onSuccess: () => {
      // On successful payments, redirect user to the orders index.
      Router.push('/orders');
    }
  });

  // We need to set up an interval that will recalculate the time
  // left to expire and update the state accordingly.
  // We should only set up the interval once, on the first render.
  useEffect( ()=>{
    // Set up an interval once, on the first render,
    // to set the remaining time left once per second.
    const findTimeLeft = () => {
      // Time left before expiration is
      // Expiration time - current time
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(msLeft / 1000));
    };
    // The interval will wait a second before running findTimeLeft for the first time.
    // so call it manually now
    findTimeLeft();
    const timerId = setInterval(findTimeLeft, 1000);

    return () => {
      // Functions returned from useEffect) are called when we navigate away from
      // the component. So when we navifate away, the interval should be cancelled.
      clearInterval(timerId)
    };
  }, []);

  if(timeLeft <= 0) {
    return(
      <div>
        Order expired
      </div>
    );
  }

  // the stripeKey is the publishable key not the secret key
  // price is in cents.
  return (
    <div>
      Time left to pay: {timeLeft} seconds.
      <StripeCheckout
        token={ (token) => {
            doRequest({token: token.id});
          }
        }
        stripeKey="pk_test_51NrkU9Ir5VklcuQgbzZ3vf9YBQVolk6WpYjUTYvNNtlF8MvSEpez4pW33n9XmGxy6pHgjSzxMO06oceZmlaxqHbm00h6vTl7Yd"
        amount = {order.ticket.price * 100}
        email = {currentUser.email}
      />
      {jsxErrors}
    </div>
  );
};

OrderShow.getInitialProps = async (context, axiosClient) => {
  // Get the order details to be rendered
  // The name of the item in query is determined by the pages file name.
  const {orderId} = context.query;
  const { data } = await axiosClient.get(`/api/orders/${orderId}`);

  // Return the order data to be given to the order show component as a prop
  return {order: data};
};

export default OrderShow;