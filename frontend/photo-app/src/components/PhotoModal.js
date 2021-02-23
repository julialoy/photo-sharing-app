import React, { PureComponent } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import Checkbox from './Checkboxes';

// const ACTIVETAGS = this.props.selectedTags ? this.props.selectedTags.filter(sTag => sTag.person_first_name) : null

class PhotoModal extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      editFormToggled: false,
      editForm: {
        checkboxes: {},
        displayDate: null,
        editedDate: null,
        editedTitle: null,
        editedDesc: null,
        editedPersonTags: [],
        successMsg: null,
        error: null
      },
      // checkboxes: {},
      // checkboxes: this.props.peopleTags.reduce( (tags, tag) => ({
      //   ...tags,
      //   [tag.person_first_name]: this.props.selectedTags ? (this.props.selectedTags.includes(tag.person_id) ? true : false) : false
      // })),
      // checkboxes: (this.props.selectedTags.length > 0 
      //   ? this.props.peopleTags.reduce((tags, tag) => ({...tags, [tag.person_first_name]: this.props.selectedTags.includes(tag.person_id) ? true : false})) 
      //   : this.props.peopleTags.reduce((tags, tag) => ({...tags, [tag.person_first_name]: false}))
      // ),
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
    // this.setCheckboxes = this.setCheckboxes.bind(this);
    this.createActiveTagList = this.createActiveTagList.bind(this);
    // this.setCheckboxState = this.setCheckboxState.bind(this);
    this.createChecklistElem = this.createChecklistElem.bind(this);
    this.createCheckbox = this.createCheckbox.bind(this);
    this.createCheckboxes = this.createCheckboxes.bind(this);
  }

  static propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
    handlePhotoDateChange: PropTypes.func
  };

  toggleEditForm() {
    const tagNames = this.props.peopleTags.map( tag => tag.person_first_name );
    const checkedNames = this.props.peopleTags.filter( tag => this.props.selectedTags.includes(tag.person_id) ).map( tag => tag.person_first_name);
    this.setState({
      editFormToggled: true,
      editForm: {
        // Set up checkbox status
        checkboxes: tagNames.reduce( (tags, tag) => ({
          ...tags,
          [tag]: checkedNames.includes(tag) ? true : false
        }),
        {}
        ),
        displayDate: this.props.photoDate,
      }
    });
  }

  getPersonIds(nameArray) {
    let completeTagArray = [];
    // console.log("PEOPLE TAGS: ", this.props.peopleTags);
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
    const newPhotoDate = this.state.editForm.editedDate;
    const newPhotoTitle = this.state.editForm.editedTitle;
    const newPhotoDesc = this.state.editForm.editedDesc;
    const newTags = this.state.editForm.editedPersonTags;

    if (!newPhotoDate && !newPhotoTitle && !newPhotoDesc && !newTags) {
      validSave = false;
    }

    if (!moment(newPhotoDate).isValid()) {
      validSave = false;
    }

    if (validSave) {
      axios.post("http://localhost:8080/edit",
      {
        photo: {
          id: this.props.photoId,
          filename: this.props.photoName,
          currDate: this.props.photoDate,
          newDate: newPhotoDate,
          currPhotoDesc: this.props.photoDesc,
          newPhotoDesc: newPhotoDesc,
          currTags: this.props.selectedTags,
          newTags: newTags
        }
      },
      {withCredentials: true}
      )
      .then(response => {
        console.log("RESPONSE DATA: ", response)
        if (response.data.edit_successful) {
          this.setState({
            editFormToggled: false,
            editForm: {
              displayDate: newPhotoDate,
              editedDesc: newPhotoDesc,
              editedPersonTags: newTags,
              successMsg: "Success! New data saved."
            }
          });
        }
        else {
          this.setState({
            editForm: {
              error: "New data not saved."
            }
          });
        }
      })
      .catch(err => console.log(err));
      
      // this.setState({
      //   editToggled: false,
      //   displayDate: newPhotoDate,
      //   date: newPhotoDate,
      //   photoDesc: newPhotoDesc,
      //   selectedTags: [...newTags],
      //   newPersonTags: []
      // });
    } else {
      this.setState({
        editFormToggled: false,
        editForm: {
          displayDate: this.props.photoDate,
          editedDate: null,
          editedTitle: null,
          editedDesc: null,
          editedPersonTags: [],
          error: "Invalid date entered"
        }
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
      editFormToggled: false
    });
  }

  handleModalClose() {
    this.closeEditForm();
    this.props.handlePhotoDateChange();
    this.props.onClose();
    this.setState({
      editFormToggled: false,
      editForm: {
        checkboxes: {},
        displayDate: null,
        editedDate: null,
        editedTitle: null,
        editedDesc: null,
        editedPersonTags: [],
        successMsg: null,
        error: null
      }
    });
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleChange(e) {
    const formValues = e.target.value;
    console.log("CHANGE DETECTED: ", formValues);
    if (e.target.name === "newPersonTags") {
      if (e.target.checked) {
        console.log("CHECKED!");
        const targetElem = e.target.id;
        document.getElementById(targetElem).setAttribute('checked', true);
        this.setState(prevState => ({
          editForm: {
            editedPersonTags: [...prevState.editForm.editedPersonTags, formValues]
          }
        }));
      } else if (!e.target.checked) {
        console.log("NOT CHECKED!");
        const targetElem = e.target.id;
        document.getElementById(targetElem).removeAttribute('checked');
        let newTagArray = this.props.selectedTags.filter((t) => t !== formValues);
        this.setState({
          editForm: {
            editedPersonTags: [...newTagArray]
          }
        });
      }
    } else {
      this.setState({
        editForm: {
          [e.target.name]: formValues
        }
      });
      console.log("NEW STATE: ", this.state);
    }
  }

  handleCancel() {
    this.setState({
      editFormToggled: false,
      editForm: {
        checkboxes: {},
        displayDate: this.props.photoDate,
        editedDate: null,
        editedTitle: null,
        editedDesc: null,
        editedPersonTags: [],
        successMsg: null,
        error: null
      }
    });
  }

  handleCloseError() {
    this.setState({
      editForm: {
        successMsg: null,
        error: null
      }
    });
  }

  createActiveTagList(tagsArray) {
    let activeTagIds = [];
    let checkedElemIds = [];
    for (let t = 0; t < this.props.selectedTags.length; t++) {
      activeTagIds.push(this.props.selectedTags[t].person_id);
    }
    for (let x = 0; x < tagsArray.length; x++) {
      if (activeTagIds.includes(tagsArray[x].person_id)) {
        const elemId = 'inlineCheckboxPhotoModal' + '-' + tagsArray[x].person_first_name;
        checkedElemIds.push(elemId);
      }
    }
    return checkedElemIds;
  }

  // setCheckboxes(idArray) {
  //   for (let x = 0; x < idArray.length; x++) {
  //     document.getElementById(idArray[x]).setAttribute('checked', true);
  //   }
  // }

  createPeopleTagList(tagsArray) {
    // let activeTagIds = [];
    // let checkedElemIds = [];
    // for (let t = 0; t < this.props.selectedTags.length; t++) {
    //   activeTagIds.push(this.props.selectedTags[t].person_id);
    // }
    let availableTagArray = [];
    for (let x = 0; x < tagsArray.length; x++) {
      let tagValue = `${tagsArray[x].person_id}, ${tagsArray[x].person_first_name}`;
      let newInputElement = <div className="form-check form-check-inline">
        <input 
          className="form-check-input" 
          type="checkbox" 
          id={'inlineCheckboxPhotoModal' + '-' + tagsArray[x].person_first_name} 
          value={tagValue} 
          key={tagsArray[x].person_id + '-input-key'} 
          name="newPersonTags" 
          onChange={this.handleChange}
        />
        <label 
          className="form-check-label" 
          htmlFor={'inlineCheckbox' + '-' + tagsArray[x].person_first_name} 
          key={tagsArray[x].person_id + '-label-key'}>
            {tagsArray[x].person_first_name}
        </label>
      </div>;
      availableTagArray.push(newInputElement);
    }
    return availableTagArray;
  }

  createChecklistElem() {
    let checklistElem = [];
    for (let x = 0; x < this.state.editForm.checkboxes.length; x++) {
      let newElem = <div className="form-check form-check-inline">
        <input 
          className="form-check-input"
          type="checkbox"
          id={'inlineCheckboxPhotoModal' + '-' + this.state.editForm.checkboxes[x][0]}
          value={this.state.editForm.checkboxes[x][0]}
          key={this.state.editForm.checkboxes[x][0] + '-input-key'}
          name="editedPersonTags"
          onChange={this.handleChange}
        />
        <label
          className="form-check-label"
          htmlFor={'inlineCheckbox' + '-' + this.state.editForm.checkboxes[x][0]}
          key={this.state.editForm.checkboxes[x][0] + '-label-key'}
        >
          {this.state.editForm.checkboxes[x][0]}
        </label>
      </div>
      checklistElem.push(newElem);
    }
    return checklistElem;
  }

  // setCheckboxState() {
  //   if (this.props.selectedTags.length > 0) {
  //     this.setState({
  //       checkboxes: this.props.peopleTags.reduce( (tags, tag) => ({
  //         ...tags,
  //       [tag.person_first_name]: this.props.selectedTags.includes(tag.person_id) ? true : false
  //       }))
  //     });
  //   } else {
  //     this.setState({
  //       checkboxes: this.props.peopleTags.reduce( (tags, tag) => ({
  //         ...tags,
  //         [tag.person_first_name]: false
  //       }))
  //     });
  //   }
  // }

  createCheckbox(option) {
    console.log("CREATE CHECKBOX (SING) FUNCTION with OPTION", option);
    // return (
    //   <Checkbox 
    //     label={option}
    //     isSelected={this.state.editForm.checkboxes[option]}
    //     onChange={this.handleChange}
    //     key={option + '-checkbox-key'}
    // />);
  }

  createCheckboxes() {
    console.log("CREATE CHECKBOXES FUNCTION");
    this.props.peopleTags.map(tag => this.createCheckbox(tag.person_first_name));
  }

  render() {
    const {
      show, 
      // photoName, 
      // fullPhoto, 
      // photoDate, 
      // photoTitle, 
      // photoDesc,
      peopleTags} = this.props;
    //const availablePeopleTags = this.createPeopleTagList(peopleTags);
    // const selectedCheckboxes = this.createActiveTagList(peopleTags);
    // this.setCheckboxes(selectedCheckboxes);
    const mediaType = this.state.photoName ? this.state.photoName.split('.')[1] : null;
    // const personTagElem = <div>
    //   <FontAwesomeIcon className="mr-2" icon="user" />
    //   {this.state.selectedTags ? this.state.selectedTags.map(tag => <span className="mr-2">{tag.person_first_name}</span>) : this.props.selectedTags.map(tag => <span className="mr-2">{tag.person_first_name}</span>)}
    // </div>
/*     const monthSelectArray = Array.from(Array(12).keys()).map(month => <option>{month+1}</option>);
    const daySelectArray = Array.from(Array(31).keys()).map(day => <option>{day+1}</option>); */
    const photoDateDiv = <div className="d-flex mt-4 justify-content-between" id="photo-modal-caption">
      {/* {this.props.selectedTags.length > 0 ? personTagElem : null} */}
      <span>
        {this.state.editForm.editedDesc ? this.state.editForm.editedDesc : this.props.photoDesc}
      </span>
      <span>
        {this.state.editForm.editedDate ? moment(this.state.editForm.editedDate).format("dddd, MMM Do YYYY") : moment(this.props.photoDate).format("dddd, MMM Do YYYY")}
        <button className="close" type="button" onClick={this.toggleEditForm} id="date-edit-btn"><span><FontAwesomeIcon icon="edit" /></span></button>
        {/* <button type="button" className="btn btn-dark" onClick={this.toggleEditForm} id="date-edit-btn">Edit</button> */}
      </span>
    </div>

    const dateEditForm = <div className="d-flex mt-4 justify-content-between">
      <form className="edit-date-form form-inline" onSubmit={this.saveNewData}>
        <div className="form-group mx-3">
          {/*this.state.editForm.checkboxes ? this.state.editForm.checkboxes : null*/}
          {this.state.editFormToggled ? this.createCheckboxes() : null}
        </div>
        <div className="form-group mx-3">
          {/* <label htmlFor="photoDesc">Photo description:</label> */}
          <textarea className="form-control form-control-sm" type="text" rows="2" defaultValue={this.state.editForm.editedDesc ? this.state.editForm.editedDesc : this.props.photoDesc} name="editedPhotoDesc" id="photoDesc" onChange={this.handleChange}></textarea>
        </div>
        <div className="form-group mx-3">
          <input className="form-control form-control-sm" type="date" defaultValue={this.state.editForm.editedDate ? this.state.editForm.editedDate : this.props.photoDate} min="1800-01-01" max="2050-01-01" name="editedDate" id="date" onChange={this.handleChange} />
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
      {this.state.editForm.successMsg}
    </div>

    const errorMessage = <div className="alert alert-danger alert-dismissible fade show row" role="alert">
      <button type="button" className="close" data-dismiss="alert" aria-label="close" onClick={this.handleCloseError}>
        <span aria-hidden="true">&times;</span>
      </button>
      {this.state.editForm.error}
    </div>

    const imgElement = <img className="full-size-photo img-fluid" src={this.props.fullPhoto} alt="" />;
    const videoElement = <video controls width="1000">
      <source src={this.props.fullPhoto} type="video/mp4"/>
      Sorry, your browser doesn't support this video format.
    </video>;

    if (show) {
      window.addEventListener('keydown', this.handleKeyDown);
    }

    if (!show) {
      return null;
    }

    console.log("PHOTO MODAL STATE: ", this.state);
    
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
            <div className="text-center mb-2" id="media-element">
              {mediaType === "mp4" ? videoElement : imgElement}
            </div>
            {this.state.editForm.error ? errorMessage : null}
            {this.state.editForm.successMsg ? successMessage : null}
            {this.state.editFormToggled ? dateEditForm : photoDateDiv}
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
              {/* {this.state.error ? errorMessage : null}
              {this.state.successMsg ? successMessage : null} */}
              {/* {this.state.editToggled ? dateEditForm : photoDateDiv} */}
          </div>
        </div>
      </div>
    )
  }
}

export default PhotoModal;