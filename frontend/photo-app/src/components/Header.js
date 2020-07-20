import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

class Header extends Component {
  constructor(props) {
    super(props);

  }
  
  static propTypes = {
    loggedInStatus: PropTypes.bool,
    currentUser: PropTypes.string,
    handleLogout: PropTypes.func
  };

  
  render() {
    const {
      currentUser,
      handleLogout
    } = this.props;
    return (
      <header>
      <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top">
        <div className="link-group">
          <a className="navbar-brand">Welcome, {currentUser}</a>
        </div>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse ml-auto" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
           <li className="nav-item">
              <a href="/filter" className="nav-link">Filter</a>
            </li>
            <li className="nav-item">
              <a href="/upload" className="nav-link">Upload</a>
            </li>
            <li className="nav-item">
              <a href="/activity" className="nav-link">Activity</a>
            </li>
            <li className="nav-item">
              <a href="/settings" className="nav-link">Settings</a>
            </li>
            <li>
              <a href="/logout" className="nav-link" onClick={handleLogout}>Log Out</a>
            </li>
          </ul>
        </div>
      </nav>
      </header>
    )
  }
}

export default withRouter(Header);
