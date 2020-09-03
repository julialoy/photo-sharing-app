import React, { Component } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import moment from 'moment';

class PhotoModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editToggled: false,
      month: "",
      day: "",
      year: ""
    };

    this.toggleEditForm = this.toggleEditForm.bind(this);
    this.saveNewDate = this.saveNewDate.bind(this);
    this.closeEditForm = this.closeEditForm.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
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
    let saveYear = this.state.year;
    let saveMonth = this.state.month;
    let saveDay = this.state.day;
    if (this.state.month === "") {
      saveMonth = (moment(this.props.photoDate).month() + 1).toString();
    }
    if (this.state.day === "") {
      saveDay = (moment(this.props.photoDate).date()).toString();
    }
    if (this.state.year === "") {
      saveYear = (moment(this.props.photoDate).year()).toString();
    }
    if (saveMonth.length === 1) {
      saveMonth = "0".concat(saveMonth);
    }
    if (saveDay.length === 1) {
      saveDay = "0".concat(saveDay);
    }
    const newPhotoDate = saveYear.concat('-', saveMonth, '-', saveDay);
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
      editToggled: false,
      month: "",
      day: "",
      year: ""
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

  handleCancel() {
    this.setState({
      editToggled: false,
      month: "",
      day: "",
      year: ""
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
        <label htmlFor="month">Month</label>
        <select defaultValue={moment(this.props.photoDate).month()+1} onChange={this.handleChange} className="form-control form-control-sm" name="month" id="month">
          {monthSelectArray}
        </select>
      </div>
      <div className="col">
        <label htmlFor="day">Day</label>
        <select defaultValue={moment(this.props.photoDate).date()} onChange={this.handleChange} className="form-control form-control-sm" name="day" id="day">
          {daySelectArray}
        </select>
      </div>
      <div className="col">
        <label htmlFor="year">Year</label>
        <input className="form-control form-control-sm" type="text" name="year" id="year" onChange={this.handleChange} placeholder={moment(this.props.photoDate).format("YYYY")} />
      </div>
      <div className="col">
        <button className="btn btn-dark" type="submit">Save</button>
      </div>
      <div className="col">
        <button className="btn btn-dark" type="button" onClick={this.handleCancel}>Cancel</button>
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