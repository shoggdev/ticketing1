import axios from 'axios';
import { useState } from 'react';

export default ({ url, method, body, onSuccess }) => {
  const [jsxErrors, setJsxErrors] = useState(null);

  const doRequest = async (props = {}) => {
  
    try {
      setJsxErrors(null); // Clears the errors out from any previous request.
      // use array lookup to set the method
      const response = await axios[method](
        url,
        // Merge any props into the body
        {...body, ...props}
      );

      if(onSuccess) {
        onSuccess(response.data); // Don't yet need the response data passed here but might be handy in the future.
      }

      return response.data;
    } catch (err) {
      setJsxErrors(
        <div className="alert alert-danger">
          <h4>Oops...</h4>
          <ul className="my-0">
            {err.response.data.errors.map(err => <li key={err.message}>{err.message}</li>)}
          </ul>
        </div>
      );
    }
  };

  return {doRequest, jsxErrors};
};

