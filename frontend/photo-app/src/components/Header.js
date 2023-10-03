import React from 'react';
import { withRouter } from 'react-router-dom';

const Header = (props) => {
  return (
    <header>
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="link-group">
        <a className="navbar-brand" href="/">Welcome, {props.currentUser}</a>
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
            <a href="/logout" className="nav-link" onClick={props.handleLogout}>Log Out</a>
          </li>
        </ul>
      </div>
    </nav>
    </header>
  );
};

export default withRouter(Header);