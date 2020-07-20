import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import Error from "./Error";
import Header from "./Header";

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
    const headerElement = <Header loggedInStatus={loggedInStatus} currentUser={currentUser} handleLogout={this.handleLogout} />
    const errorElement =  <Error />

    return (
      <div id="index-div">
        {loggedInStatus ?  headerElement : errorElement}
      </div>
    )
  }
}

export default withRouter(Home);