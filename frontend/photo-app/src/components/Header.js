import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import Logout from './Logout';
import Settings from './UserSettings';
import Activity from './Activity';
import Upload from './Upload';
import Filter from './Filter';

class Header extends Component {
  constructor(props) {
    super(props);

  }

  static propTypes = {
    loggedInStatus: PropTypes.bool,
    currentUser: PropTypes.string,
    error: PropTypes.string,
    handleSuccessfulLogOut: PropTypes.func
  };

  
  render() {
    const {
      currentUser,
      handleSuccessfulLogOut
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
{/*            <li className="nav-item">
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
            </li> */}
            <Filter />
            <Upload />
            <Activity />
            <Settings />
            <Logout currentUser={currentUser} handleSuccessfulLogOut={handleSuccessfulLogOut} />
          </ul>
        </div>
      </nav>
      </header>
    )
  }
}

export default withRouter(Header);
