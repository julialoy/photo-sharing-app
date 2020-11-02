import React, { PureComponent } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Home from './Home.js';
import Register from './Register.js';
import Signin from './Signin.js';
import axios from 'axios';
import Logout from './Logout.js';

class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      current_user: {
        id: null,
        username: '',
        accessLevel: null,
        isAuthenticated: false
      },
      photos: [],
      havePhotos: false
    }

    this.handleSuccessfulAuth = this.handleSuccessfulAuth.bind(this);
    this.checkLoginStatus = this.checkLoginStatus.bind(this);
    this.handleSuccessfulLogOut = this.handleSuccessfulLogOut.bind(this);
    this.retrievePhotos = this.retrievePhotos.bind(this);
    this.handlePhotoDateChange = this.handlePhotoDateChange.bind(this);
  }

  checkLoginStatus() {
    console.log("CHECKING LOG IN STATUS");
    axios.get("http://localhost:8080/logged_in", { withCredentials: true })
    .then(response => {
      if (response.data.is_logged_in && !this.state.current_user.isAuthenticated) {
        this.handleSuccessfulAuth(response.data);
        this.retrievePhotos();
      } else if (!response.data.is_logged_in && this.state.current_user.isAuthenticated) {
        this.setState(() => ({
          current_user: {
            id: null,
            username: '',
            accessLevel: null,
            isAuthenticated: false
          }
        }));
      }
    })
    .catch(err => console.log("LOGIN ERROR: ", err));
  }

  retrievePhotos() {
    axios.get("http://localhost:8080/", { withCredentials: true })
    .then(data => {
      if (data.data) {
        if (data.data.length > 0) {
          this.setState( () => ({
            photos: data.data,
            havePhotos: true
          }));
        }
      }
    })
    .catch(err => console.log("ERROR: ", err));
  }

  handlePhotoDateChange() {
    this.retrievePhotos();
  }

  handleSuccessfulAuth(data) {
    console.log("SUCCESSFUL AUTH DATA: ", data)
    this.setState(() => ({
      current_user: {
        id: data.user_id,
        username: data.username,
        accessLevel: data.access_level,
        isAuthenticated: true
      }
    }));
  }

  handleSuccessfulLogOut(data) {
    this.setState(() => ({
      current_user: {
        is: null,
        username: '',
        accessLevel: null,
        isAuthenticated: false
      }
    }));
  }
  
  componentDidMount() {
    console.log("COMPONENT DID MOUNT");
    this.checkLoginStatus();
  }

  render() { 
    return (
        <BrowserRouter>
          <Switch>
            <Route
              exact
              path='/'
              render={props => (
                <Home 
                  {...props}
                  isAuthed={this.state.current_user.isAuthenticated}
                  currentUser={this.state.current_user}
                  photos={this.state.photos}
                  havePhotos={this.state.havePhotos}
                  handleSuccessfulLogOut={this.handleSuccessfulLogOut}
                  retrievePhotos={this.retrievePhotos}
                  handlePhotoDateChange={this.handlePhotoDateChange}
                />
              )}
            />
            <Route 
              exact 
              path={"/register"} 
              render={props => (
                <Register 
                  {...props} 
                  handleSuccessfulAuth={this.handleSuccessfulAuth} 
                  isAuthed={this.state.current_user.isAuthenticated} 
                />
              )} 
            />
            <Route 
              exact
              path={"/login"}
              render={props => (
                <Signin 
                  {...props} 
                  isAuthed={this.state.current_user.isAuthenticated} 
                  handleSuccessfulAuth={this.handleSuccessfulAuth} 
                />
              )}
            />
            <Route 
              exact
              path={"/logout"}
              render={props => (
                <Logout 
                  {...props} 
                  currentUser={this.state.current_user} 
                  handleSuccessfulLogOut={this.handleSuccessfulLogOut} 
                />
              )}
            />
          </Switch>
        </BrowserRouter>
    );
  }
}

export default App;
