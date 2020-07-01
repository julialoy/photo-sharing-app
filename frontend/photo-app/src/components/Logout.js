import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';

class Logout extends Component {
  constructor(props) {
    super(props);
    
    this.handleLogout = this.handleLogout.bind(this);
    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
  }

  static propTypes = {
    handleSuccessfulLogOut: PropTypes.func,
    currentUser: PropTypes.string
  }

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
    return (
      <li className="nav-item">
        <button type="button" className="nav-link btn-outline-light" onClick={this.handleLogout}>Log out</button>
      </li>
    )
  }
}

export default withRouter(Logout);