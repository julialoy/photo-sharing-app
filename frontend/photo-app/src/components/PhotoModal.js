import React, { PureComponent } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class PhotoModal extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      editToggled: false,
      displayDate: this.props.photoDate,
      date: this.props.photoDate,
      photoTitle: this.props.photoTitle,
      photoDesc: this.props.photoDesc,
      selectedTags: this.props.selectedTags,
      newPersonTags: [],
      successMsg: "",
      error: ""
    };

    this.toggleEditForm = this.toggleEditForm.bind(this);
    this.getPersonIds = this.getPersonIds.bind(this);
    this.saveNewData = this.saveNewData.bind(this);
    this.closeEditForm = this.closeEditForm.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleCloseError = this.handleCloseError.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.createPeopleTagList = this.createPeopleTagList.bind(this);
  }

  static propTypes = {
    onClose: PropTypes.func,
    fullPhoto: PropTypes.string,
    peopleTags: PropTypes.array
  };

  toggleEditForm() {
    this.setState({
      editToggled: true
    });
  }

  getPersonIds(nameArray) {
    let completeTagArray = [];
    console.log("PEOPLE TAGS: ", this.props.peopleTags);
    for (let x = 0; x < nameArray.length; x++) {
      let fullTag = this.props.peopleTags.filter((t) => t.person_first_name === nameArray[x]);
      // let tagTuple = (fullTag[0], fullTag[1]);
      completeTagArray.push(fullTag);
    }
    return completeTagArray;
  }

  saveNewData(evt) {
    evt.preventDefault();
    let validSave = true
    let newPhotoDate;
    const newPhotoDesc = this.state.photoDesc;
    let newTags = this.state.newPersonTags;
    
    if (this.state.date) {
      newPhotoDate = this.state.date;
    } else {
      newPhotoDate = this.props.photoDate;
    }

    if (!newTags) {
      newTags = this.state.selectedTags;
    }

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
          newDate: newPhotoDate,
          oldPhotoDesc: this.props.photoDesc,
          newPhotoDesc: newPhotoDesc,
          oldTags: this.state.selectedTags,
          newTags: newTags
        }
      },
      {withCredentials: true}
      )
      .then(response => {
        console.log("RESPONSE DATA: ", response)
        if (response.data.edit_successful) {
          this.setState({
            displayDate: newPhotoDate,
            photoDesc: newPhotoDesc,
            selectedTags: [...newTags],
            successMsg: "Success! New data saved."
          });
        }
        else {
          this.setState({
            error: "New data not saved"
          });
        }
      })
      .catch(err => console.log(err));
      
      this.setState({
        editToggled: false,
        displayDate: newPhotoDate,
        date: newPhotoDate,
        photoDesc: newPhotoDesc,
        selectedTags: [...newTags],
        newPersonTags: []
      });
    } else {
      this.setState({
        editToggled: false,
        displayDate: this.props.photoDate,
        date: this.props.photoDate,
        photoTitle: this.props.photoTitle,
        photoDesc: this.props.photoDesc,
        selectedTags: [...this.props.selectedTags],
        newPersonTags: [],
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
      photoTitle: "",
      photoDesc: "",
      selectedTags: [],
      newPersonTags: [],
      successMsg: "",
      error: ""
    });
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleChange(e) {
    const formValues = e.target.value;
    if (e.target.name === "newPersonTags") {
      if (e.target.checked) {
        this.setState(prevState => ({
          newPersonTags: [...prevState.newPersonTags, formValues]
        }));
      } else if (!e.target.checked) {
        let newTagArray = this.state.newPersonTags.filter((t) => t !== formValues);
        this.setState({
          newPersonTags: [...newTagArray]
        });
      }
    } else {
      this.setState({
        [e.target.name]: formValues
      });
    }
    console.log(this.state);
  }

  handleCancel() {
    this.setState({
      editToggled: false,
      displayDate: this.props.photoDate,
      date: this.props.photoDate,
      photoTitle: this.props.photoTitle,
      photoDesc: this.props.photoDesc,
      selectedTags: this.props.selectedTags,
      newPersonTags: [],
      successMsg: "",
      error: ""
    });
  }

  handleCloseError() {
    this.setState({
      successMsg: "",
      error: ""
    });
  }

  createPeopleTagList(tagsArray) {
    let selectedTagIds = [];
    for (let t = 0; t < this.props.selectedTags.length; t++) {
      selectedTagIds.push(this.props.selectedTags[t].person_id);
    }
    console.log("SELECTED TAG IDS: ", selectedTagIds);
    let availableTagArray = [];
    for (let x = 0; x < tagsArray.length; x++) {
      let checkStatus;
      if (selectedTagIds.includes(tagsArray[x].person_id)) {
        checkStatus = 'checked';
      } else {
        checkStatus = null;
      }
      console.log("CHECK STATUS: ", tagsArray, checkStatus);
      let tagValue = `${tagsArray[x].person_id}, ${tagsArray[x].person_first_name}`;
      let newInputElement;
      if (!checkStatus) {
        newInputElement = <div className="form-check form-check-inline">
          <input 
            className="form-check-input" 
            type="checkbox" 
            id={'inlineCheckboxPhotoModal'} 
            value={tagValue} 
            key={tagsArray[x].person_id + '-input-key'} 
            name="newPersonTags" 
            onChange={this.handleChange}
          />
          <label 
            className="form-check-label" 
            htmlFor={'inlineCheckbox' + x} 
            key={tagsArray[x].person_id + '-label-key'}>
              {tagsArray[x].person_first_name}
          </label>
        </div>;
      } else {
        newInputElement = <div className="form-check form-check-inline">
          <input 
            className="form-check-input" 
            type="checkbox" 
            id={'inlineCheckboxPhotoModal'} 
            value={tagValue} 
            key={tagsArray[x].person_id + '-input-key'} 
            name="newPersonTags" 
            onChange={this.handleChange}
            checked
          />
          <label 
            className="form-check-label" 
            htmlFor={'inlineCheckbox' + x} 
            key={tagsArray[x].person_id + '-label-key'}>
              {tagsArray[x].person_first_name}
          </label>
        </div>;
      }
      availableTagArray.push(newInputElement);
    }
    return availableTagArray;
  }

  render() {
    const {show, photoName, fullPhoto, photoDate} = this.props;
    const availablePeopleTags = this.createPeopleTagList(this.props.peopleTags);
    const mediaType = photoName.split('.')[1];
/*     const monthSelectArray = Array.from(Array(12).keys()).map(month => <option>{month+1}</option>);
    const daySelectArray = Array.from(Array(31).keys()).map(day => <option>{day+1}</option>); */
    const photoDateDiv = <div className="d-flex mt-4 justify-content-between" id="photo-modal-caption">
      <span>
        {this.state.photoDesc ? this.state.photoDesc : this.props.photoDesc}
      </span>
      <span>
        {this.state.displayDate ? moment(this.state.displayDate).format("dddd, MMM Do YYYY") : moment(photoDate).format("dddd, MMM Do YYYY")}
        <button className="close" type="button" onClick={this.toggleEditForm} id="date-edit-btn"><span><FontAwesomeIcon icon="edit" /></span></button>
        {/* <button type="button" className="btn btn-dark" onClick={this.toggleEditForm} id="date-edit-btn">Edit</button> */}
      </span>
    </div>

    const dateEditForm = <div className="d-flex mt-4 justify-content-between">
      <form className="edit-date-form form-inline" onSubmit={this.saveNewData}>
        <div className="form-group mx-3">
          {availablePeopleTags}
{/*           <select multiple className="form-control" id="person-tag-select" name="newPersonTags" onChange={this.handleChange}>
            {availablePeopleTags}
          </select> */}
        </div>
        <div className="form-group mx-3">
          {/* <label htmlFor="photoDesc">Photo description:</label> */}
          <textarea className="form-control form-control-sm" type="text" rows="2" defaultValue={this.state.photoDesc ? this.state.photoDesc : this.props.photoDesc} name="photoDesc" id="photoDesc" onChange={this.handleChange}></textarea>
        </div>
        <div className="form-group mx-3">
          <input className="form-control form-control-sm" type="date" defaultValue={this.state.date ? this.state.date : this.props.photoDate} min="1800-01-01" max="2050-01-01" name="date" id="date" onChange={this.handleChange} />
        </div>
        <div className="form-group mx-3" id="photo-form-btn">
          <button className="btn btn-dark" type="submit">Save</button>
        </div>
        <div className="form-group mx-3" id="photo-cancel-btn">
          <i className="fas fa-pencil-alt"></i>
          <button className="btn btn-dark" type="button" onClick={this.handleCancel}>Cancel</button>
        </div>
      </form>
    </div>

    const successMessage = <div className="alert alert-success alert-dismissible fade show" role="alert">
      <button type="button" className="close" data-dismiss="alert" aria-label="close" onClick={this.handleCloseError}>
        <span aria-hidden="true">&times;</span>
      </button>
      {this.state.successMsg}
    </div>

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
          <div className="modal-header">
            <h5>{this.props.photoTitle}</h5>
            <button className="close" onClick={this.handleModalClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="text-center" id="media-element">
              {mediaType === "mp4" ? videoElement : imgElement}
            </div>
            {this.state.editToggled ? dateEditForm : photoDateDiv}
{/*             <div className="d-flex mt-4 justify-content-between" id="photo-modal-caption">
              <span>
                {this.state.photoDesc ? this.state.photoDesc : this.props.photoDesc}
              </span>
              <span>
                {this.state.displayDate ? moment(this.state.displayDate).format("dddd, MMM Do YYYY") : moment(photoDate).format("dddd, MMM Do YYYY")}
              </span>
            </div> */}
          </div>
          <div className="modal-footer">
              {this.state.error ? errorMessage : null}
              {this.state.successMsg ? successMessage : null}
              {/* {this.state.editToggled ? dateEditForm : photoDateDiv} */}
          </div>
        </div>
      </div>
    )
  }
}

export default PhotoModal;