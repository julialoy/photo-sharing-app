import React, { Component } from "react";
import { withRouter, BrowserRouter, Link, Switch, Route } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import Upload from "./Upload";
import Year from "./Year";

class Home extends Component {
  constructor(props) {
    super(props);

    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleUploadRedirect = this.handleUploadRedirect.bind(this);
    this.handleRetrievePhotos = this.handleRetrievePhotos.bind(this);
  }

  static propTypes = {
    isAuthed: PropTypes.bool.isRequired,
    currentUser: PropTypes.object,
    photos: PropTypes.array,
    havePhotos: PropTypes.bool,
    handleSuccessfulLogOut: PropTypes.func,
    retrievePhotos: PropTypes.func
  };

  handleLoginRedirect() {
    this.props.history.push("/login");
  }

  handleUploadRedirect() {
    this.props.history.push("/upload");
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

  handleRetrievePhotos() {
    this.props.retrievePhotos();
  }

  componentDidMount() {
    this.handleRetrievePhotos();
  }

  render() {
        
    const {
      isAuthed,
      currentUser,
      photos,
      havePhotos
    } = this.props;

    console.log("LOGGED IN?", isAuthed);
    console.log("PHOTOS: ", photos);
    console.log("HAVE PHOTOS? ", havePhotos);

    if (!isAuthed) {
      this.handleLoginRedirect();
    }

    return (
      <BrowserRouter>
        <div id="index-div">
          <header>
            <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top">
              <div className="link-group">
                <Link to="/" className="navbar-brand">Welcome, {currentUser.username}</Link>
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
        </div>
        {this.props.havePhotos ? <Year photos={this.props.photos} /> : <p>You haven't added any photos!</p>}
          <Switch>
            <Route 
              path={"/upload"}
              render={props => (
                <Upload {...props} isAuthed={isAuthed} currentUser={currentUser} />
              )}
            />
          </Switch>
      </BrowserRouter>
    )
  }
}

export default withRouter(Home);