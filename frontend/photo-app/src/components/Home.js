import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import Error from "./Error";
import Header from "./Header";

class Home extends Component {

  static propTypes = {
    loggedInStatus: PropTypes.bool.isRequired,
    currentUser: PropTypes.string.isRequired
  };

  render() {
        
    const {
      loggedInStatus,
      currentUser
    } = this.props;

    console.log("LOGGED IN?", loggedInStatus);
    const headerElement = <Header loggedInStatus={loggedInStatus} currentUser={currentUser} />
    const errorElement =  <Error />

    return (
      <div id="index-div">
        {loggedInStatus ?  headerElement : errorElement}
      </div>
    )
  }
}

export default withRouter(Home);