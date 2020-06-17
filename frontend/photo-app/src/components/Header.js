import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Header extends Component {
  static propTypes ={
    loggedInStatus: PropTypes.bool,
    currentUser: PropTypes.string,
    greeting: PropTypes.string,
    error: PropTypes.string
  };

  render() {
    const {
      loggedInStatus,
      currentUser,
      greeting,
      error
    } = this.props;
    return (
      <header>
      <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top">
        <div className="link-group">
          <a className="navbar-brand">{greeting}, {currentUser}</a>
        </div>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse ml-auto" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item">
              <a className="nav-link">Filter</a>
            </li>
            <li className="nav-item">
              <a className="nav-link">Upload</a>
            </li>
            <li className="nav-item">
              <a className="nav-link">Activity</a>
            </li>
            <li className="nav-item">
              <a className="nav-link">Settings</a>
            </li>
            <li className="nav-item">
              <a className="nav-link">Log out</a>
            </li>
          </ul>
        </div>
      </nav>
      </header>
    )
  }
}


export default Header;
