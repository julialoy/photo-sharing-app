import React, { PureComponent } from 'react';
import ModalCaption from './ModalCaption';
import ModalEditForm from './ModalEditForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ModalMediaElement from './ModalMediaElement';
import ModalSuccess from './ModalSuccess';
import ModalError from './ModalError';

class ModalMainPhoto extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      editFormToggled: false,
      checkboxes: {},
      editedDate: null,
      editedTitle: null,
      editedDesc: null,
      editedPersonTags: [],
    };

    this.initializeCheckboxes = this.initializeCheckboxes.bind(this);
    this.toggleEditBtn = this.toggleEditBtn.bind(this);
    this.handleEditFormToggle = this.handleEditFormToggle.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleEditFormChange = this.handleEditFormChange.bind(this);
    this.parseCheckboxChanges = this.parseCheckboxChanges.bind(this);
    this.handleCloseEditForm = this.handleCloseEditForm.bind(this);
    this.handleEditFormSubmit = this.handleEditFormSubmit.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  initializeCheckboxes() {
    const firstNames = this.props.peopleTags.map(tag => tag.person_first_name);
    const activeOptions = this.props.peopleTags.filter(tag => this.props.selectedTags.includes(tag.person_id)).map(tag => tag.person_first_name);
    this.setState({
      checkboxes: firstNames.reduce( (tags, tag) => ({
        ...tags,
        [tag]: activeOptions.includes(tag) ? true : false
      }),
      {}
      )
    });
  }

  toggleEditBtn() {
    const targetElem = document.getElementById('date-edit-btn');
    if(targetElem.style.display === 'none') {
      targetElem.style.display = 'block';
    } else {
      targetElem.style.display = 'none';
    }
  }
  
  handleEditFormToggle() {
    console.log(this.props.photoDesc);
    if(this.props.currentUser.accessLevel === "primary") {
      this.initializeCheckboxes();
      this.setState({
        editFormToggled: true
      });
      this.toggleEditBtn();
    }
  }

  handleCheckboxChange(e) {
    console.log("CHECKBOX CHANGED");
    console.log(e);
    const name = e.target.value;
    this.setState( prevState => ({
      checkboxes: {
        ...prevState.checkboxes,
        [name]: !prevState.checkboxes[name]
      }
    }));
  }

  handleEditFormChange(e) {
    const formValues = e.target.value;
    this.setState({
      [e.target.name]: formValues
    });
  }

  parseCheckboxChanges() {
    let newActiveTags = [];
    const availableTags = this.props.peopleTags;
    for(let x = 0; x < availableTags.length; x++) {
      if(this.state.checkboxes[availableTags[x].person_first_name]) {
        newActiveTags.push(availableTags[x].person_id);
      }
    }
    return newActiveTags;
  }

  handleCloseEditForm() {
    this.setState({
      editFormToggled: false,
      checkboxes: {},
      editedDate: null,
      editedTitle: null,
      editedDesc: null,
      editedPersonTags: []
    });
    if(this.props.currentUser.accessLevel === "primary") {
      this.toggleEditBtn();
    }
    console.log(this.props.photoDesc);
  }

  handleEditFormSubmit(e) {
    const parsedCheckboxChanges = this.parseCheckboxChanges();
    this.props.handlePhotoDataSubmit(e, this.state.editedDate, this.state.editedDesc, parsedCheckboxChanges);
    this.handleCloseEditForm();
  }

  handleModalClose() {
    this.handleCloseEditForm();
    this.props.onClose();
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(e) {
    if(e.keyCode === 27) {
      this.handleModalClose();
    }
  }

  render() {
    const editButton = <button className="close" type="button" onClick={this.handleEditFormToggle} id="date-edit-btn"><span><FontAwesomeIcon icon="edit" /></span></button>;

    if(!this.props.photoIsOpen) {
      return null;
    }

    if(this.props.photoIsOpen) {
      window.addEventListener('keydown', this.handleKeyDown);
    }

    console.log("MODAL STATE: ", this.state);
    return (
    <div className="modal-backdrop" id="photo-modal-container">
      <div className="modal" display="block" id="photo-modal">
        <div className="modal-header">
          <h5>
            {this.props.photoTitle}
          </h5>
          <button className="close" onClick={this.handleModalClose}>
            <span>
              &times;
            </span>
          </button>
        </div>
        <div className="modal-body">
          <div className="text-center" id="media-element">
            <ModalMediaElement 
              mediaType={this.props.mediaType}
              fullPhoto={this.props.fullPhoto}
            />
            <div className="d-flex justify-content-between" id="photo-modal-caption">
              {this.props.errorMsg ? 
              <ModalError 
                errorMsg={this.props.errorMsg}
                handleCloseMsg={this.props.handleCloseMsg}
              /> :
               null}
              {this.props.successMsg ? 
              <ModalSuccess 
                successMsg={this.props.successMsg}
                handleCloseMsg={this.props.handleCloseMsg}
              /> : 
              null}
              {!this.state.editFormToggled ? 
              <ModalCaption
                photoDesc={this.props.photoDesc}
                photoDate={this.props.photoDate}
              /> : 
              <ModalEditForm
                editFormIsOpen={this.state.editFormToggled}
                photoDesc={this.props.photoDesc}
                photoDate={this.props.photoDate}
                peopleTags={this.props.peopleTags}
                editedDesc={this.state.editedDesc}
                editedDate={this.state.editedDate}
                checkboxes={this.state.checkboxes}
                handleFormChange={this.handleEditFormChange}
                handleCheckboxChange={this.handleCheckboxChange}
                handleSubmit={this.handleEditFormSubmit}
                handleFormClose={this.handleCloseEditForm}
              />}
              {this.props.currentUser.accessLevel === "primary" ? editButton : null}
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }
}

export default ModalMainPhoto;