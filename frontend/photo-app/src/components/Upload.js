import React, { Component, useEffect } from 'react';
import { withRouter }  from 'react-router-dom';
import PropTypes from 'prop-types';
import Dropzone, { useDropzone } from 'react-dropzone';
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
    this.handleIndexRedirect = this.handleIndexRedirect.bind(this);
    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleUploadModalClose = this.handleUploadModalClose.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDropzoneReset = this.handleDropzoneReset.bind(this);
    this.handleCloseAlert = this.handleCloseAlert.bind(this);
    this.handleRemoveFromDrop = this.handleRemoveFromDrop.bind(this);
  }

  static propTypes = {
    onClose: PropTypes.func,
    show: PropTypes.bool,
    isAuthed: PropTypes.bool.isRequired,
    completePhotoUpload: PropTypes.func,
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
    if (e.keyCode === 27) {
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
    if (this.state.files.length <= 1) {
      this.setState({
        files: []
      });
    } else {
      for (let x = 0; x < this.state.files.length; x++) {
        if (this.state.files[x].fileName === targetFilename) {
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

  handleIndexRedirect() {
    console.log("NOW REDIRECT BACK TO THE INDEX");
    this.props.history.push("/");
  }

  handleDropzoneReset() {
    this.state.files.forEach(file => URL.revokeObjectURL(file.preview));
    this.setState({
      files: []
    });
  }

  handleUpload(evt) {
    evt.preventDefault();
    console.log("Send file data to backend");
    console.log("FILE DATA: ", this.state.files);

    let imageData = new FormData();
    console.log("FORM DATA BEFORE APPEND: ", imageData);

    for (let x= 0; x < this.state.files.length; x++) {
      imageData.append('image' + x, this.state.files[x].fileData);
      console.log("APPENDING ", 'image', x, this.state.files[x].fileData);
    }

    axios.post("http://localhost:8080/upload",
      imageData, 
      { withCredentials: true }
      )
      .then(response => {
        console.log(response.data);
        if (response.data.error) {
          console.log("There was a problem uploading your file: ", response.data.error);
        } else if (response.data.upload_successful) {
          this.props.completePhotoUpload(true);
          this.setState({
            successMsg: "Upload successful!"
          });
          this.handleDropzoneReset();
        } else {
          console.log("Something unexpected happened!");
          this.props.completePhotoUpload(false);
          this.setState({
            errorMsg: "Something went wrong."
          });
        }
      })
      .catch(err => console.log(err));
  }

  render() {
    const {show, isAuthed} = this.props;
    const successAlert = <div className="alert alert-success alert-dismissible fade show" role="alert">
    {this.state.successMsg}
    <button type="button" className="close" onClick={this.handleCloseAlert} aria-label="close"><span>&times;</span></button>
    </div>;

    const errorAlert = <div className="alert alert-danger alert-dismissible fade show" role="alert">{this.state.errorMsg}<button type="button" className="close" onClick={this.handleCloseAlert} aria-label="close"><span>&times;</span></button></div>

    console.log("UPLOAD IS AUTHORIZED? ", isAuthed);

    if (!isAuthed) {
      this.handleLoginRedirect();
    }

    if (show) {
      window.addEventListener('keydown', this.handleKeyDown);
    }

    if (!show) {
      return null;
    }

    console.log("UPLOAD STATE: ", this.state);
    return (
      <div className="modal-backdrop">
        <div className="modal" display="block" id="upload-modal">
          <div className="modal-header">
            <button className="close" onClick={this.handleUploadModalClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="upload-field row">
            <Dropzone onDrop={this.handleDrop}>
                {({ getRootProps, getInputProps }) => (
                  <div className="col">
                    <div {...getRootProps({ className: "dropzone" })}>
                      <input {...getInputProps()} />
                      <p>Drag and drop files to upload</p>
                        {this.state.files.map(file => (
                            <img key={file.fileName} className="upload-thumb" src={file.preview} alt="" />
                        ))}
                    </div>
                  </div>
                )}
              </Dropzone>
              <div className="file-list col">
                <strong>Files:</strong>
                <ul>
                  {this.state.files.map(file => (
                    <li key={file.fileName}>
                      {file.fileName} <button className="close" type="button" key={file.filename + "-btn"} id="thumb-delete-btn"><span key={file.filename + "-span"} onClick={() => this.handleRemoveFromDrop({file})}>&times;</span></button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button className="btn btn-dark" type="submit" onClick={this.handleUpload}>Upload</button>
            {this.state.successMsg ? successAlert : null}
            {this.state.errorMsg ? errorAlert : null}
          </div>
        </div>
      </div>
    )
  }
}

export default withRouter(Upload);