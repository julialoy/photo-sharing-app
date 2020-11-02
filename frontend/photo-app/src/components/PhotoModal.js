import React, { PureComponent } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import moment from 'moment';

class PhotoModal extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      editToggled: false,
      displayDate: this.props.photoDate,
      date: this.props.photoDate,
      error: ""
    };

    this.toggleEditForm = this.toggleEditForm.bind(this);
    this.saveNewDate = this.saveNewDate.bind(this);
    this.closeEditForm = this.closeEditForm.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleCloseError = this.handleCloseError.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  static propTypes = {
    onClose: PropTypes.func,
    fullPhoto: PropTypes.string
  };

  toggleEditForm() {
    this.setState({
      editToggled: true
    });
  }

  saveNewDate(evt) {
    evt.preventDefault();
    let validSave = true
    const newPhotoDate = this.state.date;

    if (!moment(newPhotoDate).isValid()) {
      validSave = false
    }

    if (validSave) {
      axios.post("http://localhost:8080/edit",
      {
        photo: {
          id: this.props.photoId,
          filename: this.props.photoName,
          oldDate: this.props.photoDate,
          newDate: newPhotoDate
        }
      },
      {withCredentials: true}
      )
      .then(response => {
        if (response.data.edit_successful) {
          this.setState({
            displayDate: newPhotoDate
          });
        }
        else {
          this.setState({
            error: "Date not saved"
          });
        }
      })
      .catch(err => console.log(err));
      
      this.setState({
        editToggled: false,
        displayDate: newPhotoDate,
        date: newPhotoDate
      });
    } else {
      this.setState({
        editToggled: false,
        displayDate: this.props.photoDate,
        date: this.props.photoDate,
        error: "Invalid date entered"
      });
    }
  }
  
  handleKeyDown(e) {
    if (e.keyCode === 27) {
      this.handleModalClose();
    }
  }

  closeEditForm() {
    this.setState({
      editToggled: false
    });
  }

  handleModalClose() {
    this.closeEditForm();
    this.props.handlePhotoDateChange();
    this.props.onClose();
    this.setState({
      editToggled: false,
      displayDate: "",
      date: "",
      error: ""
    });
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleChange(e) {
    const formValues = e.target.value;
    this.setState({
      [e.target.name]: formValues
    });
  }

  handleCancel() {
    this.setState({
      editToggled: false,
      displayDate: this.props.photoDate,
      date: this.props.photoDate
    });
  }

  handleCloseError() {
    this.setState({
      error: ""
    });
  }

  render() {
    const {show, photoName, fullPhoto, photoDate} = this.props;
    const mediaType = photoName.split('.')[1];
    const monthSelectArray = Array.from(Array(12).keys()).map(month => <option>{month+1}</option>);
    const daySelectArray = Array.from(Array(31).keys()).map(day => <option>{day+1}</option>);
    const photoDateDiv = <div className="photo-date">
      {this.state.displayDate ? moment(this.state.displayDate).format("dddd, MMM Do YYYY") : moment(photoDate).format("dddd, MMM Do YYYY")} 
      <button type="button" className="btn btn-dark" onClick={this.toggleEditForm} id="date-edit-btn">Edit</button>
    </div>

    const dateEditForm = <form className="edit-date-form form-row" onSubmit={this.saveNewDate}>
      <div className="col">
        <input className="form-control form-control-sm" type="date" defaultValue={this.state.date ? this.state.date : this.props.photoDate} min="1800-01-01" max="2050-01-01" name="date" id="date" onChange={this.handleChange} />
      </div>
      <div className="col" id="photo-form-btn">
        <button className="btn btn-dark" type="submit">Save</button>
      </div>
      <div className="col">
        <button className="btn btn-dark" type="button" onClick={this.handleCancel}>Cancel</button>
      </div>
    </form>

    const errorMessage = <div className="alert alert-danger alert-dismissible fade show row" role="alert">
      <button type="button" className="close" data-dismiss="alert" aria-label="close" onClick={this.handleCloseError}>
        <span aria-hidden="true">&times;</span>
      </button>
      {this.state.error}
    </div>

    const imgElement = <img className="full-size-photo img-fluid" src={fullPhoto} alt="" />;
    const videoElement = <video controls width="1000">
      <source src={fullPhoto} type="video/mp4"/>
      Sorry, your browser doesn't support this video format.
    </video>;

    if (show) {
      window.addEventListener('keydown', this.handleKeyDown);
    }

    if (!show) {
      return null;
    }

    return (
       <div className="modal-backdrop">
        <div className="modal" display="block" id="photo-modal">
          <div>
          <div>
            <div className="modal-header">
              <button className="close" onClick={this.handleModalClose}>
                  <span>&times;</span>
              </button>
              </div>
              <div className="modal-body text-center">
                {mediaType === "mp4" ? videoElement : imgElement}
              </div>
              <div className="modal-footer">
                {this.state.error ? errorMessage: null}
                <div className="row">
                  {this.state.editToggled ? dateEditForm : photoDateDiv}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default PhotoModal;