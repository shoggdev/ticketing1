import { useState } from 'react';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

export default () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {doRequest, jsxErrors } = useRequest({
    url: '/api/users/signup',
    method: 'post',
    body: {
      email, password
    },

    onSuccess: () => Router.push('/')     // Redirect to home i.e. /pages/index.js
  });

  const onSubmit = async (event) => {
    event.preventDefault();
  
    await doRequest();
  };

  return (
    <form onSubmit={onSubmit}>
      <h1>Sign Up</h1>
      <div className="form-group">
        <label>Email Address</label>
        <input 
          value={email}
          onChange={ ( e ) => { setEmail(e.target.value) } }
          className="form-control">
        </input>
      </div>
      <div className="form-group">
        <label>Password</label>
        <input
          value={password}
          onChange = { (e) => { setPassword(e.target.value) } }
          type="password"
          className="form-control">
        </input>
      </div>
      { jsxErrors }
      <button className="btn btn-primary">Sign Up</button>
    </form>
  );
};