import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Activity extends Component {
  render() {
    return (
      <li className="nav-item">
        <button type="button" className="nav-link btn-outline-light">Activity</button>
      </li>
    )
  }
}

export default Activity;