import React, { Component } from 'react';
import { withRouter }  from 'react-router-dom';
import PropTypes from 'prop-types';
import Dropzone from 'react-dropzone';
import axios from 'axios';

class Upload extends Component {
  constructor(props) {
    super(props);

    this.state = {
      files: [],
      successMsg: "",
      errorMsg: ""
    };

    this.handleDrop = this.handleDrop.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleUploadModalClose = this.handleUploadModalClose.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDropzoneReset = this.handleDropzoneReset.bind(this);
    this.handleCloseAlert = this.handleCloseAlert.bind(this);
    this.handleRemoveFromDrop = this.handleRemoveFromDrop.bind(this);
    this.handleThumbRender = this.handleThumbRender.bind(this);
  }

  static propTypes = {
    onClose: PropTypes.func,
    show: PropTypes.bool,
    isAuthed: PropTypes.bool.isRequired,
    // completePhotoUpload: PropTypes.func,
    handlePhotoUpload: PropTypes.func,
    currentUser: PropTypes.object
  };

  handleUploadModalClose() {
    this.setState({
      files: []
    });
    this.props.onClose();
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(e) {
    if(e.keyCode === 27) {
      this.handleUploadModalClose();
    }
  }

  handleCloseAlert() {
    this.setState({
      successMsg: "",
      errorMsg: ""
    });
  }
  
  handleDrop(acceptedFiles) {
    acceptedFiles.map(file => (
      this.setState( prevState => ({
        files: prevState.files.concat({ fileName: file.name, fileData: file, preview: URL.createObjectURL(file)})
      }))
    ));
  }

  handleRemoveFromDrop(file) {
    const targetFilename = file.file.fileName;
    let deleteIndex;
    if(this.state.files.length <= 1) {
      this.setState({
        files: []
      });
    } else {
      for(let x = 0; x < this.state.files.length; x++) {
        if(this.state.files[x].fileName === targetFilename) {
          deleteIndex = x;
        }
      }
      let newFilesArray = this.state.files.slice();
      newFilesArray.splice(deleteIndex, 1);
      this.setState({
        files: newFilesArray
      });
    }
  }

  handleLoginRedirect() {
    this.props.history.push("/login");
  }

  handleDropzoneReset() {
    this.state.files.forEach(file => URL.revokeObjectURL(file.preview));
    this.setState({
      files: []
    });
  }

  handleUpload(evt) {
    evt.preventDefault();
    let imageData = new FormData();

    for(let x= 0; x < this.state.files.length; x++) {
      imageData.append('image' + x, this.state.files[x].fileData);
    }

    axios.post("http://localhost:8080/upload",
      imageData, 
      {withCredentials: true}
      )
      .then(response => {
        if(response.data.error) {
          this.setState({
            errorMsg: "Unable to upload files. Something went wrong."
          });
          console.log("ERROR UPLOADING: ", response.data.error);
        } else if(response.data.upload_successful) {
          // this.props.completePhotoUpload(true);
          this.props.handlePhotoUpload(true);
          this.setState({
            successMsg: "Upload successful!"
          });
          this.handleDropzoneReset();
        } else {
          // this.props.completePhotoUpload(false);
          this.props.handlePhotoUpload(false);
          this.setState({
            errorMsg: "Unable to upload files. Something went wrong."
          });
        }
      })
      .catch(err => console.log(err));
  }

  handleThumbRender(filesArray) {
    console.log("IN HANDLE THUMB RENDER: ", filesArray);
    let uploadArray = [];
    for(let x = 0; x < filesArray.length; x++) {
      let fileExtension = filesArray[x].fileName.split('.')[1];
      if(fileExtension === 'mp4') {
        uploadArray.push(
          <span className="upload-thumb-container">
            <video className="video-thumb" key={`${filesArray[x].fileName}-video`}>
              <source className="video-thumb-source" key={filesArray[x].fileData} type="video/mp4" src={filesArray[x].preview} />
            </video>
          </span>
        );
      } else {
        uploadArray.push(<span className="upload-thumb-container"><img key={filesArray[x].fileName} className="upload-thumb" src={filesArray[x].preview} alt="" /></span>);
      }
    }
    return uploadArray;
  }

  render() {
    const {show, isAuthed} = this.props;
    const successAlert = <div className="alert alert-success alert-dismissible fade show" role="alert">
      {this.state.successMsg}
      <button type="button" className="close" onClick={this.handleCloseAlert} aria-label="close"><span>&times;</span></button>
      </div>;
    const errorAlert = <div className="alert alert-danger alert-dismissible fade show" role="alert">
      {this.state.errorMsg}
      <button type="button" className="close" onClick={this.handleCloseAlert} aria-label="close">
      <span>&times;</span>
      </button>
      </div>;

    if(!isAuthed) {
      this.handleLoginRedirect();
    }

    if(show) {
      window.addEventListener('keydown', this.handleKeyDown);
    } else {
      return null;
    }

    // if (!show) {
    //   return null;
    // }

    return (
      <div className="modal-backdrop">
        <div className="modal" display="block" id="upload-modal">
          <div className="modal-header">
            <button className="close" onClick={this.handleUploadModalClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body container">
            {this.state.successMsg ? successAlert : null}
            {this.state.errorMsg ? errorAlert : null}
            <div className="upload-field row">
            <Dropzone onDrop={this.handleDrop}>
                {({ getRootProps, getInputProps }) => (
                  <div className="row">
                    <div {...getRootProps({ className: "dropzone" })}>
                      <input {...getInputProps()} />
                      <p>Drag and drop files to upload</p>
                      {/* <p className="upload-para">  */}
                        {this.handleThumbRender(this.state.files)}
                      {/* </p> */}
                    </div>
                  </div>
                )}
              </Dropzone>
              <div className="file-list col">
                <strong>Files:</strong>
                <ul id="thumb-list">
                  {this.state.files.map(file => (
                    <li key={file.fileName}>
                      {file.fileName} 
                      <button className="close" type="button" key={file.fileName + "-btn"} id="thumb-delete-btn">
                        <span key={file.fileName + "-span"} onClick={() => this.handleRemoveFromDrop({file})}>
                          &times;
                        </span>
                      </button>
                    </li>
                  ))}
                  
                </ul>
              </div>
            </div>
            <button className="btn btn-dark" type="submit" onClick={this.handleUpload} id="upload-submit-btn">Upload</button>
            <button className="btn btn-dark" type="button" onClick={this.handleDropzoneReset} id="upload-clear-btn">Clear All</button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Upload);