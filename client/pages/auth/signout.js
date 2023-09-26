import { useEffect } from 'react';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

export default () => {
  const { doRequest } = useRequest({
    url: '/api/users/signout',
    method: 'post',
    body: {},
    onSuccess: () => Router.push('/')
  });

  useEffect( () => {
    doRequest();
  }, [] ); // Pass an empty array as second argument as this should only run once.

  return (
    <div>
      Signing you out...
    </div>
  );
};