import React, { Component } from 'react';

class Error extends Component {

  render() {
    return (
      <div className="alert alert-danger text-center" id="errorAlert" role="alert">
        <h1 className="h4">Please <a href="/login" className="alert-link">log in</a>.</h1>
      </div>
    );
  }
}

export default Error;