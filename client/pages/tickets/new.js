import { useState } from 'react';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const NewTicket = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const { doRequest, jsxErrors } = useRequest({
    url: '/api/tickets',
    method: 'post',
    body: {
      title: title,
      price: price
    },
    onSuccess: () => {
      Router.push('/')
    }
  });

  const onPriceBlur = () => {
    const value = parseFloat(price);
    if(isNaN(value)) {
      // Empty the input
      setPrice('');
      return;
    }
    setPrice(value.toFixed(2));
  };

  const onSubmitForm = (event) => {
    event.preventDefault();

    doRequest();
  };

  return (
    <div>
      <h1>Create a ticket</h1>
      <form onSubmit={onSubmitForm}>
        <div className="form-group">
          <label>Title</label>
          <input value={title} onChange={ (e)=>{setTitle(e.target.value)} } className="form-control" />
        </div>
        <div className="form-group">
          <label>Price</label>
          <input value={price} onChange={ (e)=>{setPrice(e.target.value)} } onBlur={onPriceBlur} className="form-control" />
        </div>
        {jsxErrors}
        <button className="btn btn-primary">Submit</button>
      </form>
    </div>
  )
};

export default NewTicket;