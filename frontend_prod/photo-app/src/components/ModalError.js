import React from 'react';

const ModalError = (props) => (
  <div className="alert alert-danger alert-dismissible fade show row" role="alert">
    <button type="button" className="close" data-dismiss="alert" aria-label="close" onClick={props.handleCloseMsg}>
      <span aria-hidden="true">
        &times;
      </span>
    </button>
    {props.errorMsg}
  </div>
);

export default ModalError;