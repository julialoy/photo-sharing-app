import React, { PureComponent } from "react";
import { withRouter, BrowserRouter, Link } from "react-router-dom";
import PropTypes from "prop-types";
import axios from 'axios';
import moment from 'moment';
// import Upload from "./Upload";
import Year from "./Year";
// import Settings from "./UserSettings";
import Modal from "./Modal";

class Home extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      showUploadModal: false,
      showSettingsModal: false,
      photoModal: {
        showPhotoModal: false,
        photoId: null,
        photoFilename: null,
        fullSizeLoc: null,
        fullSizeDate: null,
        photoTitle: null,
        photoDesc: null,
        selectedTags: [],
        mediaType: null,
        successMsg: null,
        errorMsg: null
      }
    };

    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleRetrievePhotos = this.handleRetrievePhotos.bind(this);
    this.showPhotoModal = this.showPhotoModal.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleCompletePhotoUpload = this.handleCompletePhotoUpload.bind(this);
    this.showUploadModal = this.showUploadModal.bind(this);
    // this.handleUploadModalClose = this.handleUploadModalClose.bind(this);
    this.showSettingsModal = this.showSettingsModal.bind(this);
    // this.handleSettingsModalClose = this.handleSettingsModalClose.bind(this);
    this.handlePhotoDataSubmit = this.handlePhotoDataSubmit.bind(this);
    this.handleCloseModalMsg = this.handleCloseModalMsg.bind(this);
  }

  static propTypes = {
    isAuthed: PropTypes.bool.isRequired,
    currentUser: PropTypes.object,
    photos: PropTypes.array,
    peopleTags: PropTypes.array,
    havePhotos: PropTypes.bool,
    handleSuccessfulLogOut: PropTypes.func,
    retrievePhotos: PropTypes.func,
    showFullSize: PropTypes.func
  };

  handlePhotoDataSubmit(evt, editedDate, editedDesc, editedTags) {
      evt.preventDefault();
      let validSave = true;

      if(editedDate === null) {
        editedDate = this.state.photoModal.fullSizeDate;
      }
  
      if(!moment(editedDate).isValid()) {
        validSave = false;
      }

      if( 
        (editedDate === this.state.photoModal.fullSizeDate || editedDate === null) 
        && (editedDesc === this.state.photoModal.photoDesc || editedDesc === null) 
        && editedTags === this.state.photoModal.selectedTags) {
        validSave = false;
      }
      
      if(validSave) {
        axios.post("http://localhost:8080/edit",
        {
          photo: {
            id: this.state.photoModal.photoId,
            filename: this.state.photoModal.photoFilename,
            currDate: this.state.photoModal.fullSizeDate,
            newDate: editedDate !== null ? editedDate : this.state.photoModal.fullSizeDate,
            currPhotoDesc: this.state.photoModal.photoDesc,
            newPhotoDesc: editedDesc !== null ? editedDesc : this.state.photoModal.photoDesc,
            currTags: this.state.photoModal.selectedTags,
            newTags: editedTags
          }
        },
        {withCredentials: true}
        )
        .then(response => {
          if(response.data.edit_successful) {
            this.setState( prevState => ({
              photoModal: {
                showPhotoModal: true,
                photoId: prevState.photoModal.photoId,
                photoFilename: prevState.photoModal.photoFilename,
                fullSizeLoc: prevState.photoModal.fullSizeLoc,
                fullSizeDate: editedDate,
                photoTitle: prevState.photoModal.photoTitle,
                photoDesc: editedDesc,
                mediaType: prevState.photoModal.mediaType,
                selectedTags: [...editedTags],
                successMsg: "Success!"
              }
            }));
          } else {
            console.log("Unable to save data");
            this.setState({
              photoModal: {
                showPhotoModal: true,
                errorMsg: "Unable to save."
              }
            });
          }
        })
        .catch(err => console.log(err));
      } else {
        console.log("INVALID DATA");
        this.setState({
          photoModal: {
            errorMsg: "Invalid data entered"
          }
        });
      }
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
        if(response.data.log_out_successful) {
          this.props.handleSuccessfulLogOut(response.data);
          this.handleLoginRedirect();
        }
      })
      .catch(err => console.log(`LOGOUT ERROR: ${err}`));
  }

  handleRetrievePhotos() {
    this.props.retrievePhotos();
  }

  handleCompletePhotoUpload(didPhotoUpload) {
    if(didPhotoUpload) {
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

  // handleSettingsModalClose() {
  //   this.setState({
  //     showSettingsModal: false
  //   });
  //   document.body.classList.remove('modal-open');
  // }

  showUploadModal() {
    // Lock scrolling on body component
    this.setState({
      showUploadModal: true
    });
    document.body.classList.add('modal-open');
  }

  // handleUploadModalClose() {
  //   this.setState({
  //     showUploadModal: false
  //   });
  //   // Allow scrolling on body component
  //   document.body.classList.remove('modal-open');
  // }

  showPhotoModal(photoData) {
    const photoDateStrip = photoData.date_taken.split('T')[0];
    this.setState({
      photoModal: {
        showPhotoModal: true,
        photoId: photoData.photo_id,
        selectedTags: [...photoData.child_id],
        photoFilename: photoData.filename,
        photoTitle: photoData.title,
        photoDesc: photoData.description,
        fullSizeLoc: photoData.full_size_loc,
        fullSizeDate: photoDateStrip ? photoDateStrip : photoData.date_taken,
        mediaType: photoData.filename.split('.')[1]
      }
    });
    // Add 'modal-open'class on open so scroll bar will be removed and scrolling locked on body
    document.body.classList.add('modal-open');
  }

  handleModalClose() {
    this.setState({
      showUploadModal: false,
      showSettingsModal: false,
      photoModal: {
        showPhotoModal: false,
        photoId: null,
        selectedTags: [],
        photoFilename: null,
        photoTitle: null,
        photoDesc: null,
        fullSizeLoc: null,
        fullSizeDate: null,
        mediaType: null,
        successMsg: null,
        errorMsg: null
      }
    });
    // Remove 'modal-open' class on close so body will scroll
    document.body.classList.remove('modal-open');
    this.handleRetrievePhotos();
  }

  handleCloseModalMsg() {
    this.setState(prevState => ({
      photoModal: {
        showPhotoModal: prevState.photoModal.showPhotoModal,
        photoId: prevState.photoModal.photoId,
        photoFilename: prevState.photoModal.photoFilename,
        fullSizeLoc: prevState.photoModal.fullSizeLoc,
        fullSizeDate: prevState.photoModal.fullSizeDate,
        photoTitle: prevState.photoModal.photoTitle,
        photoDesc: prevState.photoModal.photoDesc,
        selectedTags: prevState.photoModal.selectedTags,
        mediaType: prevState.photoModal.mediaType,
        successMsg: null,
        errorMsg: null
      }
    }));
  }

  componentDidMount() {
    this.handleRetrievePhotos();
  }

  render() {
    const {
      isAuthed,
      currentUser,
    } = this.props;

    // This creates a warning about not updating during an existing state transition
    if(!isAuthed) {
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
        {/* <Upload 
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
          peopleTags={this.props.peopleTags}
          onClose={this.handleSettingsModalClose}
        /> */}
        <Modal
          isAuthed={isAuthed}
          uploadIsOpen={this.state.showUploadModal}
          handlePhotoUpload={this.handleCompletePhotoUpload}
          settIsOpen={this.state.showSettingsModal}
          currentUser={currentUser}
          photoIsOpen={this.state.photoModal.showPhotoModal} 
          photoId={this.state.photoModal.photoId} 
          photoName={this.state.photoModal.photoFilename} 
          fullPhoto={this.state.photoModal.fullSizeLoc}
          photoDate={this.state.photoModal.fullSizeDate}
          photoTitle={this.state.photoModal.photoTitle}
          photoDesc={this.state.photoModal.photoDesc}
          onClose={this.handleModalClose}
          handlePhotoDateChange={this.props.handlePhotoDateChange}
          peopleTags={this.props.peopleTags}
          selectedTags={this.state.photoModal.selectedTags}
          mediaType={this.state.photoModal.mediaType}
          handlePhotoDataSubmit={this.handlePhotoDataSubmit}
          successMsg={this.state.photoModal.successMsg}
          errorMsg={this.state.photoModal.errorMsg}
          handleCloseMsg={this.handleCloseModalMsg}
          handlePeopleTagChange={this.props.handlePeopleTagChange}
        /> 
        {this.props.havePhotos ? 
          <Year years={this.state.photoYears} photos={this.props.photos} showPhotoModal={this.showPhotoModal} /> : 
          <p>You haven't added any photos!</p>}
        </div>
      </BrowserRouter>
    )
  }
}

export default withRouter(Home);