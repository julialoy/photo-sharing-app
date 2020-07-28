import React, { Component } from "react";
import { withRouter, BrowserRouter, Link, Switch, Redirect, Route } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import Upload from "./Upload";

class Home extends Component {
  constructor(props) {
    super(props);

    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  static propTypes = {
    loggedInStatus: PropTypes.bool.isRequired,
    currentUser: PropTypes.string.isRequired,
    handleSuccessfulLogOut: PropTypes.func
  };

  handleLoginRedirect() {
    this.props.history.push("/login");
  }
  
  handleLogout(evt) {
    evt.preventDefault();
    axios.post("http://localhost:8080/logout",
      {
        user: {
          username: this.props.currentUser
        }
      },
      {withCredentials: true}
      )
      .then(response => {
        if (response.data.log_out_successful) {
          console.log("Log out successful ", response.data);
          this.props.handleSuccessfulLogOut(response.data);
          this.handleLoginRedirect();
        }
      })
      .catch(err => console.log("LOGOUT ERROR: ", err));
  }

  render() {
        
    const {
      loggedInStatus,
      currentUser
    } = this.props;

    console.log("LOGGED IN?", loggedInStatus);

/*    if (!loggedInStatus) {
      return (<Redirect to="/login" />);
    } */

    return (
      <BrowserRouter>
        <div id="index-div">
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
                  <Link to="/upload" className="nav-link">Upload</Link>
                </li>
                <li className="nav-item">
                  <Link to="/activity" className="nav-link">Activity</Link>
                </li>
                <li className="nav-item">
                  <Link to="/settings" className="nav-link">Settings</Link>
                </li>
                <li>
                  <Link to="/logout" className="nav-link" onClick={this.handleLogout}>Log Out</Link>
                </li>
              </ul>
            </div>
          </nav>
          </header>
          <Switch>
            <Route 
              path={"/upload"}
              render={props => (
                <Upload {...props} />
              )}
            />
          </Switch>
        </div>
      </BrowserRouter>
    )
  }
}

export default withRouter(Home);