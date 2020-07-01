import React, { Component } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Home from './Home';
import Register from './Register';
import Signin from './Signin';
import axios from 'axios';


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      current_user_id: null,
      current_user_username: "",
      current_user_state: false
    }

    this.handleSuccessfulAuth = this.handleSuccessfulAuth.bind(this);
    this.checkLoginStatus = this.checkLoginStatus.bind(this);
    this.handleSuccessfulLogOut = this.handleSuccessfulLogOut.bind(this);
  }

  checkLoginStatus() {
    axios.get("http://localhost:8080/logged_in", { withCredentials: true })
    .then(response => {
      console.log(response.data)
      console.log(response.data.is_logged_in);
      if (response.data.is_logged_in && !this.state.current_user_state) {
        this.handleSuccessfulAuth(response.data);
      } else if (!response.data.is_logged_in && this.state.current_user_state) {
        this.setState({
          current_user_id: null,
          current_user_username: "",
          current_user_state: false
        });
      }
    })
    .catch(err => console.log("LOGIN ERROR: ", err));
  }

  componentDidMount() {
    this.checkLoginStatus();
  }

  handleSuccessfulAuth(data) {
    this.setState({
      current_user_id: data.user_id,
      current_user_username: data.username,   
      current_user_state: true
    });
  }

  handleSuccessfulLogOut(data) {
    this.setState({
      current_user_id: null,
      current_user_username: "",
      current_user_state: data.log_out_successful
    });
  }

  render() { 
    return (
      // <div id="app">
        <BrowserRouter>
          <Switch>
            <Route
              exact
              path={"/"}
              render={props => (
                <Home {...props} handleSuccessfulLogOut={this.handleSuccessfulLogOut} currentUser={this.state.current_user_username} loggedInStatus={this.state.current_user_state} />
              )}
            />
            <Route 
              exact 
              path={"/register"} 
              render={props => (
                <Register {...props} handleSuccessfulAuth={this.handleSuccessfulAuth} loggedInStatus={this.state.current_user_state} />
              )} 
            />
            <Route 
              exact
              path={"/login"}
              render={props => (
                <Signin {...props} handleSuccessfulAuth={this.handleSuccessfulAuth} />
              )}
            />
          </Switch>
        </BrowserRouter>
      // </div>
    );
  }
}


export default App;
