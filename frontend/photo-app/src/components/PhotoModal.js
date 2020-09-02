import React, { Component } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import moment from 'moment';

class PhotoModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editToggled: false,
      newMonth: "",
      newDay: "",
      newYear: ""
    };

    this.toggleEditForm = this.toggleEditForm.bind(this);
    this.saveNewDate = this.saveNewDate.bind(this);
    this.closeEditForm = this.closeEditForm.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
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
    const newPhotoDate = this.state.newMonth.concat('-', this.state.newDay, '-', this.state.newYear);
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
    .then(response => console.log(response))
    .catch(err => console.log(err));
    this.setState({
      editToggled: false
    });
  }

  closeEditForm() {
    this.setState({
      editToggled: false
    });
  }

  handleModalClose() {
    this.closeEditForm();
    this.props.onClose();
  }

  handleChange(e) {
    const formValues = e.target.value;
    this.setState({
      [e.target.name]: formValues
    });
  }


  render() {
    console.log("PHOTO MODAL STATE: ", this.state);
    const {show, fullPhoto} = this.props;

    const monthSelectArray = Array.from(Array(12).keys()).map(month => <option>{month+1}</option>);
    const daySelectArray = Array.from(Array(31).keys()).map(day => <option>{day+1}</option>);

    const photoFullDate = moment(this.props.photoDate);
    const displayDate = moment(photoFullDate._d).format("dddd, MMM Do YYYY");

    const photoDateDiv = <div className="photo-date">
      {displayDate} 
      <button className="btn btn-dark" onClick={this.toggleEditForm}>Edit</button>
    </div>

    const dateEditForm = <form className="edit-date-form form-row" onSubmit={this.saveNewDate}>
      <div className="col">
        <label htmlFor="newMonth">Month</label>
        <select defaultValue={moment(this.props.photoDate).month()+1} onChange={this.handleChange} className="form-control form-control-sm" name="newMonth" id="newMonth">
          {monthSelectArray}
        </select>
      </div>
      <div className="col">
        <label htmlFor="newDay">Day</label>
        <select defaultValue={moment(this.props.photoDate).date()} onChange={this.handleChange} className="form-control form-control-sm" name="newDay" id="newDay">
          {daySelectArray}
        </select>
      </div>
      <div className="col">
        <label htmlFor="newYear">Year</label>
        <input className="form-control form-control-sm" type="text" name="newYear" id="newYear" onChange={this.handleChange} placeholder={moment(this.props.photoDate).format("YYYY")} />
      </div>
      <div className="col">
        <button className="btn btn-dark" type="submit">Save</button>
      </div>
    </form>

    if (!this.props.show) {
      return null;
    }

    return (
       <div className="modal-backdrop">
        <div className="modal" display="block" id="photo-modal">
          <div>
          <div>
            <div className="modal-header">
              <button className="close" onClick={this.handleModalClose}>
                  x
              </button>
              </div>
              <div className="modal-body">
                <img className="full-size-photo" src={fullPhoto} alt="" />
              </div>
              <div className="modal-footer">
                {this.state.editToggled ? dateEditForm : photoDateDiv}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default PhotoModal;