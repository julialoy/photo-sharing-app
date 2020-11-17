import React, { PureComponent } from "react";
import { withRouter, BrowserRouter, Link, Switch, Route } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import Upload from "./Upload";
import Year from "./Year";
import PhotoModal from './PhotoModal';
import Settings from './UserSettings';

class Home extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      showUploadModal: false,
      showPhotoModal: false,
      photoId: "",
      photoFilename: "",
      fullSizeLoc: "",
      fullSizeDate: "",
      showSettingsModal: false
    };

    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
/*     this.handleUploadRedirect = this.handleUploadRedirect.bind(this); */
    this.handleRetrievePhotos = this.handleRetrievePhotos.bind(this);
    this.showPhotoModal = this.showPhotoModal.bind(this);
    this.handlePhotoModalClose = this.handlePhotoModalClose.bind(this);
    this.handleCompletePhotoUpload = this.handleCompletePhotoUpload.bind(this);
    this.showUploadModal = this.showUploadModal.bind(this);
    this.handleUploadModalClose = this.handleUploadModalClose.bind(this);
    this.showSettingsModal = this.showSettingsModal.bind(this);
    this.handleSettingsModalClose = this.handleSettingsModalClose.bind(this);
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

/*   handleUploadRedirect() {
    this.props.history.push("/upload");
  } */
  
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

  showSettingsModal() {
    this.setState({
      showSettingsModal: true
    });
    document.body.classList.add('modal-open');
  }

  handleSettingsModalClose() {
    this.setState({
      showSettingsModal: false
    });
    document.body.classList.remove('modal-open');
  }

  showUploadModal() {
    // Lock scrolling on body component
    this.setState({
      showUploadModal: true
    });
    document.body.classList.add('modal-open');
  }

  handleUploadModalClose() {
    this.setState({
      showUploadModal: false
    });
    // Allow scrolling on body component
    document.body.classList.remove('modal-open');
  }

  showPhotoModal(photoData) {
    const photoDateStrip = photoData.date_taken.split('T')[0];
    
    this.setState({
      showPhotoModal: true,
      photoId: photoData.photo_id,
      photoFilename: photoData.filename,
      fullSizeLoc: photoData.full_size_loc,
      fullSizeDate: photoDateStrip ? photoDateStrip : photoData.date_taken
    });
    // Add 'modal-open'class on open so scroll bar will be removed and scrolling locked on body
    document.body.classList.add('modal-open');
  }

  handlePhotoModalClose() {
    this.setState({
      showPhotoModal: false,
      photoId: "",
      photoFilename: "",
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

/*     console.log("LOGGED IN?", isAuthed);
    console.log("PHOTOS: ", photos);
    console.log("HAVE PHOTOS? ", havePhotos);
    console.log("SHOULD MODAL SHOW?", this.state.showPhotoModal); */

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
                        to="/" 
                        className="nav-link"
                        onClick={this.showUploadModal}
                      >
                        Upload
                      </Link>
                    </li>
{/*                     <li className="nav-item">
                      <Link 
                        to="/activity" 
                        className="nav-link"
                      >
                        Activity
                      </Link>
                    </li> */}
                    <li className="nav-item">
                      <Link 
                        to="/" 
                        className="nav-link"
                        onClick={this.showSettingsModal}
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
        <div className="container-fluid" id="main-body">
        <Upload 
          isAuthed={isAuthed}
          show={this.state.showUploadModal}
          completePhotoUpload={this.handleCompletePhotoUpload}
          currentUser={currentUser}
          onClose={this.handleUploadModalClose}
        />
        <Settings 
          isAuthed={isAuthed}
          show={this.state.showSettingsModal}
          currentUser={currentUser}
          onClose={this.handleSettingsModalClose}
        />
        <PhotoModal 
          show={this.state.showPhotoModal}
          photoId={this.state.photoId}
          photoName={this.state.photoFilename}
          fullPhoto={this.state.fullSizeLoc}
          photoDate={this.state.fullSizeDate} 
          onClose={this.handlePhotoModalClose}
          handlePhotoDateChange={this.props.handlePhotoDateChange} 
        />
        {this.props.havePhotos ? <Year years={this.state.photoYears} photos={this.props.photos} showPhotoModal={this.showPhotoModal} /> : <p>You haven't added any photos!</p>}
        </div>
      </BrowserRouter>
    )
  }
}

export default withRouter(Home);