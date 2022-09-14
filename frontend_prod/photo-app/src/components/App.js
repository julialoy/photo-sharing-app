import React, { PureComponent } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Home from './Home.js';
import Register from './Register.js';
import Signin from './Signin.js';
import axios from 'axios';
import Logout from './Logout.js';
import ConfirmInvite from './ConfirmInvite';

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
      havePhotos: false,
      peopleTags: []
    }

    this.handleSuccessfulAuth = this.handleSuccessfulAuth.bind(this);
    this.checkLoginStatus = this.checkLoginStatus.bind(this);
    this.handleSuccessfulLogOut = this.handleSuccessfulLogOut.bind(this);
    this.retrievePhotos = this.retrievePhotos.bind(this);
    this.handlePhotoDateChange = this.handlePhotoDateChange.bind(this);
    this.handlePeopleTagChange = this.handlePeopleTagChange.bind(this);
  }

  checkLoginStatus() {
    axios.get("http://www.hoard.pics/logged_in", { withCredentials: true })
    .then(response => {
      if(response.data.is_logged_in && !this.state.current_user.isAuthenticated) {
        this.handleSuccessfulAuth(response.data);
        this.retrievePhotos();
      } else if(!response.data.is_logged_in && this.state.current_user.isAuthenticated) {
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
    .catch(err => console.log(`LOGIN ERROR: ${err}`));
  }

  retrievePhotos() {
    axios.get("http://www.hoard.pics/", {withCredentials: true})
    .then(data => {
      if(data.data.photos) {
        console.log(`PHOTOS DATA: ${data.data.photos}`);
        if(data.data.photos.length > 0) {
          this.setState( () => ({
            photos: data.data.photos,
            havePhotos: true
          }));
        }
      }
      if(data.data.tags) {
        if(data.data.tags.length > 0) {
          this.setState( () => ({
            peopleTags: [...data.data.tags]
          }));
        }
      }
    })
    .catch(err => console.log(`ERROR: ${err}`));
  }

  handlePhotoDateChange() {
    this.retrievePhotos();
  }

  handlePeopleTagChange() {
    console.log("PEOPLE TAG CHANGE HANDLER");
    this.retrievePhotos();
    console.log("STATE AFTER HANDLE TAG CHANGE: ", this.state.peopleTags);
  }

  handleSuccessfulAuth(data) {
    // console.log("SUCCESSFUL AUTH DATA: ", data)
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
        username: "",
        accessLevel: null,
        isAuthenticated: false
      }
    }));
  }
  
  componentDidMount() {
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
                  peopleTags={this.state.peopleTags}
                  havePhotos={this.state.havePhotos}
                  handlePeopleTagChange={this.handlePeopleTagChange}
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
              path={"/register-invite"}
              render={props => (
                <ConfirmInvite 
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