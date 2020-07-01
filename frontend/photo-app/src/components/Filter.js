import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Filter extends Component {

  render() {
    return (
      <li className="nav-item">
        <button type="button" className = "nav-link btn-outline-light">Filter</button>
      </li>
    )
  }
}

export default Filter;