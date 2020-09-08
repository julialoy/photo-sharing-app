import React, { PureComponent } from "react";
import { withRouter, BrowserRouter, Link, Switch, Route } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import Upload from "./Upload";
import Year from "./Year";
import PhotoModal from './PhotoModal';

class Home extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      photoId: "",
      fullSizeLoc: "",
      fullSizeDate: ""
    };

    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleUploadRedirect = this.handleUploadRedirect.bind(this);
    this.handleRetrievePhotos = this.handleRetrievePhotos.bind(this);
    this.showPhotoModal = this.showPhotoModal.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleCompletePhotoUpload = this.handleCompletePhotoUpload.bind(this);
  }

  static propTypes = {
    isAuthed: PropTypes.bool.isRequired,
    currentUser: PropTypes.object,
    photos: PropTypes.array,
    havePhotos: PropTypes.bool,
    handleSuccessfulLogOut: PropTypes.func,
    retrievePhotos: PropTypes.func,
    showFullSize: PropTypes.func
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

  handleCompletePhotoUpload(didPhotoUpload) {
    if (didPhotoUpload) {
      this.handleRetrievePhotos();
    } else {
      console.log("Photo did not upload properly");
    }
  }

  showPhotoModal(photoData) {
    this.setState({
      showModal: true,
      photoId: photoData.photo_id,
      photoFilename: photoData.filename,
      fullSizeLoc: photoData.full_size_loc,
      fullSizeDate: photoData.date_taken
    });
    // Add 'modal-open'class on open so scroll bar will be removed and scrolling locked on body
    document.body.classList.add('modal-open');
    console.log("showPhotoModal toggled: ", photoData.full_size_loc);
  }

  handleModalClose() {
    console.log("HANDLE MODAL CLOSE");
    this.setState({
      showModal: false,
      fullSizeLoc: "",
      fullSizeDate: ""
    });
    // Remove 'modal-open' class on close so body will scroll
    document.body.classList.remove('modal-open');
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
    console.log("SHOULD MODAL SHOW?", this.state.showModal);

    if (!isAuthed) {
      this.handleLoginRedirect();
    }

    return (
      <BrowserRouter>
        <div id="index-div">
          <header>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
              <div className="link-group">
                <Link 
                  to="/" 
                  className="navbar-brand"
                >
                  Welcome, {currentUser.username}
                </Link>
              </div>
              <button 
                className="navbar-toggler" 
                type="button" data-toggle="collapse" 
                data-target="#navbarSupportedContent" 
                aria-controls="navbarSupportedContent" 
                aria-expanded="false" 
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              <div 
                className="collapse navbar-collapse ml-auto" 
                id="navbarSupportedContent"
              >
                <ul className="navbar-nav mr-auto">
                  <li className="nav-item">
                      <a 
                        href="/filter" 
                        className="nav-link"
                      >
                        Filter
                      </a>
                    </li>
                    <li className="nav-item">
                      <Link 
                        to="/upload" 
                        className="nav-link"
                      >
                        Upload
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link 
                        to="/activity" 
                        className="nav-link"
                      >
                        Activity
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link 
                        to="/settings" 
                        className="nav-link"
                      >
                        Settings
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/logout" 
                        className="nav-link" 
                        onClick={this.handleLogout}
                      >
                        Log Out
                      </Link>
                    </li>
                </ul>
              </div>
            </nav>
          </header>
        </div>
        <div className="container-fluid">
        <PhotoModal 
          show={this.state.showModal}
          photoId={this.state.photoId}
          photoName={this.state.photoFilename}
          fullPhoto={this.state.fullSizeLoc}
          photoDate={this.state.fullSizeDate} 
          onClose={this.handleModalClose}
          handlePhotoDateChange={this.props.handlePhotoDateChange} 
        />
        {this.props.havePhotos ? <Year years={this.state.photoYears} photos={this.props.photos} showPhotoModal={this.showPhotoModal} /> : <p>You haven't added any photos!</p>}
          <Switch>
            <Route 
              path={"/upload"}
              render={props => (
                <Upload {...props} isAuthed={isAuthed} completePhotoUpload={this.handleCompletePhotoUpload} currentUser={currentUser} />
              )}
            />
          </Switch>
        </div>
      </BrowserRouter>
    )
  }
}

export default withRouter(Home);