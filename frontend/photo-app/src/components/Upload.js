import React, { Component } from 'react';
import { withRouter }  from 'react-router-dom';
import Dropzone from 'react-dropzone';
import axios from 'axios';

class Upload extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fileNames: [],
      fileData: []
    };

    this.handleDrop = this.handleDrop.bind(this);
    this.setFileNames = this.setFileNames.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleIndexRedirect = this.handleIndexRedirect.bind(this);
  }
  
  setFileNames(files) {
    files.map(file => this.state.fileNames.push(file.name));
  }
  
  handleDrop(acceptedFiles) {
    console.log(acceptedFiles);
    this.setFileNames(acceptedFiles);
    this.state.fileData.push(acceptedFiles);
  }

  handleIndexRedirect() {
    this.props.history.push("/");
  }

  handleUpload(evt) {
    evt.preventDefault();
    console.log("Send file data to backend");
    console.log("FILE NAMES: ", this.state.fileNames);
    console.log("FILE DATA: ", this.state.fileData);

    let imageData = new FormData();
    console.log("FORM DATA BEFORE APPEND: ", imageData);
    for (let x = 0; x < this.state.fileData.length; x++) {
      imageData.append('image' + x, this.state.fileData[x][0]);
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
          this.handleIndexRedirect();
        } else {
          console.log("Something unexpected happened!");
        }
      })
      .catch(err => console.log(err));

  }

  componentDidMount() {

  }

  render() {
    return (
      <div className="upload-field">
        <Dropzone onDrop={this.handleDrop}>
          {({ getRootProps, getInputProps }) => (
            <div {...getRootProps({ className: "dropzone" })}>
              <input {...getInputProps()} />
              <p>Drag and drop files to upload</p>
            </div>
          )}
        </Dropzone>
        <div className="file-list">
          <strong>Files:</strong>
          <ul>
            {this.state.fileNames.map(file => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </div>
        <button type="submit" onClick={this.handleUpload}>Upload</button>
      </div>
    )
  }
}

export default withRouter(Upload);