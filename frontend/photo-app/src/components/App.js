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

    // let signal = axios.CancelToken.source();
    
    this.state = {
      current_user: {
        id: null,
        username: '',
        accessLevel: null,
        isAuthenticated: false
      },
      photos: [],
      havePhotos: false,
      photosFiltered: false,
      filteredTags: [],
      peopleTags: []
    };

    this.signal = axios.CancelToken.source();
    this.handleSuccessfulAuth = this.handleSuccessfulAuth.bind(this);
    this.checkLoginStatus = this.checkLoginStatus.bind(this);
    this.handleSuccessfulLogOut = this.handleSuccessfulLogOut.bind(this);
    this.retrievePhotos = this.retrievePhotos.bind(this);
    this.handlePhotoDateChange = this.handlePhotoDateChange.bind(this);
    this.handlePeopleTagChange = this.handlePeopleTagChange.bind(this);
    this.filterPhotos = this.filterPhotos.bind(this);
    this.resetFilter = this.resetFilter.bind(this);
  }

  checkLoginStatus() {
    axios.get("http://localhost:8080/logged_in", {withCredentials: true}, {cancelToken: this.signal.token})
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
    axios.get("http://localhost:8080/", {withCredentials: true}, {cancelToken: this.signal.token})
    .then(data => {
      if(data.data.photos) {
        // console.log("PHOTOS DATA: ", data.data.photos);
        if(data.data.photos.length > 0) {
          this.setState( prevState => ({
            photos: prevState.photosFiltered ? this.filterPhotos(prevState.filteredTags, data.data.photos) : data.data.photos,
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

  filterPhotos(tagId, photoArray) {
    let filteredPhotos = [];
    for(let i = 0; i < tagId.length; i++) {
      console.log("FILTER TAG ", i);
      // Not using filter/arrow function to avoid error/potential memory leak
      let selectedPhotos = [];
      for(let p = 0; p < photoArray.length; p++) {
        if(photoArray[p].child_id.includes(tagId[i]) && !filteredPhotos.includes(photoArray[p])) {
          selectedPhotos.push(photoArray[p]);
        }
      }
      filteredPhotos = filteredPhotos.concat(selectedPhotos);
    };
    this.handleFilterPhotos(tagId);
    return filteredPhotos;
  }

  handleFilterPhotos(tagIds) {
    if(tagIds.length > 0) {
      this.setState({
        filteredTags: tagIds,
        photosFiltered: true
      }, () => console.log(this.state.filteredTags));
    } else {
      this.setState({
        filteredTags: [],
        photosFiltered: false
      });
    }
  }

  resetFilter() {
    this.setState({
      filteredTags: [],
      photosFiltered: false
    });
  }

  handlePhotoDateChange() {
    this.retrievePhotos();
  }

  handlePeopleTagChange() {
    // console.log("PEOPLE TAG CHANGE HANDLER");
    this.retrievePhotos();
    // console.log("STATE AFTER HANDLE TAG CHANGE: ", this.state.peopleTags);
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
        id: null,
        username: "",
        accessLevel: null,
        isAuthenticated: false
      }
    }));
  }
  
  componentDidMount() {
    this.checkLoginStatus();
  }

  componentWillUnmount() {
    this.signal.cancel('Cancelling subscriptions');
  }

  // componentDidUpdate() {
  //   this.retrievePhotos();
  // }

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
                  filterPhotos={this.filterPhotos}
                  filteredTags={this.state.filteredTags}
                  handlePhotoDateChange={this.handlePhotoDateChange}
                  resetFilter={this.resetFilter}
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