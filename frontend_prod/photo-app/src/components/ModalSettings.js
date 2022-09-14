import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import ModalTagForm from './ModalTagForm';
import ModalSuccess from './ModalSuccess';
import ModalError from './ModalError';

class ModalSettings extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      inviteEmail: "",
      accessLevel: "Friend/Family",
      errorMsg: "",
      successMsg: "",
      inviteCode: "",
      newPersonFN: "",
      newPersonLN: "",
      prsnSuccessMsg: "",
      prsnErrorMsg: "",
      checkboxes: {}
    };

    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleCloseSettings = this.handleCloseSettings.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
    this.handleNewPerson = this.handleNewPerson.bind(this);
    this.handleNewUserInvite = this.handleNewUserInvite.bind(this);
    this.handleCloseError = this.handleCloseError.bind(this);
    this.handleClosePrsnError = this.handleClosePrsnError.bind(this);
    this.handleCloseMsg = this.handleCloseMsg.bind(this);
    this.handleClosePrsnMsg = this.handleClosePrsnMsg.bind(this);
    this.initializeCheckboxes = this.initializeCheckboxes.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.parseCheckboxChanges = this.parseCheckboxChanges.bind(this);
    this.handleTagFormSubmit = this.handleTagFormSubmit.bind(this);
  }

  handleLoginRedirect() {
    this.props.history.push("/login");
  }

  handleCloseSettings() {
    this.setState({
      inviteEmail: "",
      accessLevel: "Friend/Family",
      errorMsg: "",
      successMsg: "",
      inviteCode: "",
      newPersonFN: "",
      newPersonLN: "",
      prsnSuccessMsg: "",
      prsnErrorMsg: "",
      checkboxes: {},
      newPeopleTags: null
    });
  }

  handleKeyDown(e) {
    if(e.keyCode === 27) {
      this.handleModalClose();
    }
  }

  handleModalClose() {
    this.handleCloseSettings();
    this.props.onClose();
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleFormChange(evt) {
    this.setState({
      [evt.target.name]: evt.target.value
    });
  }

  // Check that response needs to send tags?
  // Check that checkboxes need to be initialized?
  handleNewPerson(evt) {
    evt.preventDefault();
    const firstName = this.state.newPersonFN;
    const lastName = this.state.newPersonLN;

    if(firstName.length === 0 || (firstName.length === 0 && lastName.length === 0)) {
      this.setState({
        prsnErrorMsg: "Please provide a name."
      });
    } else {
      axios.post("http://www.hoard.pics/add-person",
        {
          newPerson: {
            first: firstName,
            last: lastName
          }
        },
        {withCredentials: true}
      )
      .then(response => {
        console.log(`ADD PERSON RESPONSE: ${response.data}`);
        if(response.data.person_added) {
          this.setState({
            newPersonFN: "",
            newPersonLN: "",
            prsnSuccessMsg: `${firstName} ${lastName} added!`,
            newPeopleTags: response.data.current_tags
          });
          this.initializeCheckboxes(response.data.current_tags);
          this.props.handlePeopleTagChange();
        } else {
          this.setState({
            prsnErrorMsg: `Unable to add ${firstName} ${lastName}.`
          });
        }
      })
      .catch(err => console.log(`ADD PERSON ERROR: ${err}`));
    }
  }

  handleNewUserInvite(evt) {
    evt.preventDefault();
    const inviteEmail = this.state.inviteEmail;
    let accessLevel = this.state.inviteEmail;

    if(accessLevel === "") {
      accessLevel = "Friend/Family";
    }

    if(inviteEmail === "") {
      this.setState({
        errorMsg: "Invalid email provided. Cannot send invite."
      });
    } else {
      axios.post("http://www.hoard.pics/invite",
        {
        invite: {
          email: this.state.inviteEmail,
          accessLevel: this.state.accessLevel
        } 
        },
        {withCredentials: true}
      )
      .then(response => {
        console.log(`INVITE RESPONSE: ${response.data}`);
        if(response.data.invite_sent) {
          this.setState({
            inviteEmail: "",
            successMsg: `Success! Use this code to invite your family or friend: ${response.data.invite_code}.`,
            inviteCode: response.data.invite_code
          });
        }
      })
      .catch(err => console.log(`INVITE ERROR: ${err}`));
    }
  }

  handleCloseError() {
    this.setState({
      errorMsg: "",
    });
  }

  handleClosePrsnError() {
    this.setState({
      prsnErrorMsg: ""
    });
  }

  handleCloseMsg() {
    this.setState({
      inviteEmail: "",
      accessLevel: "Friend/Family",
      successMsg: "",
      inviteCode: ""
    });
  }

  handleClosePrsnMsg() {
    this.setState({
      newPersonFN: "",
      newPersonLN: "",
      prsnSuccessMsg: "",
      prsnErrorMsg: ""
    });
  }

  initializeCheckboxes(currPeopleTags) {
    const firstNames = currPeopleTags.map(tag => tag.person_first_name);
    const activeOptions = currPeopleTags.filter(tag => this.props.selectedTags.includes(tag.person_id)).map(tag => tag.person_first_name);
    this.setState({
      checkboxes: firstNames.reduce( (tags, tag) => ({
        ...tags,
        [tag]: activeOptions.includes(tag) ? true : false
      }),
      {}
      )
    });
  }

  handleCheckboxChange(e) {
    console.log("SETTINGS CHECKBOX CHANGED");
    console.log(e);
    const name = e.target.value;
    this.setState(prevState => ({
      checkboxes: {
        ...prevState.checkboxes,
        [name]: !prevState.checkboxes[name]
      }
    }));
  }

  parseCheckboxChanges() {
    let deleteTags = [];
    const availableTags = this.props.peopleTags;
    for(let x = 0; x < availableTags.length; x++) {
      if(this.state.checkboxes[availableTags[x].person_first_name]) {
        deleteTags.push(availableTags[x].person_id);
      }
    }
    return deleteTags;
  }

  // Check  that response needs to include tags?
  // Check that checkboxes need to be initialized here?
  handleTagFormSubmit(e) {
    e.preventDefault();
    const tagsToDelete = this.parseCheckboxChanges();
    console.log("HANDLE TAG FORM SUBMIT TAGS TO DELETE: ", tagsToDelete);
    if(tagsToDelete) {
      axios.post("http://www.hoard.pics/delete-tag",
        {deleteTags: tagsToDelete},
        {withCredentials: true}
      )
      .then(response => {
        if(response.data.success) {
          console.log("TAG FORM RESPONSE DATA: ", response.data);
          this.setState({
            newPeopleTags: response.data.current_tags
          }, () => {
            console.log("NEW CURRENT TAGS: ", this.state.newPeopleTags)
            this.initializeCheckboxes(this.state.newPeopleTags);
          });
          console.log('TAG(S) SUCCESSFULLY DELETED');
          this.props.handlePeopleTagChange();
        } else {
          this.setState({
            errorMsg: response.data.error
          });
        }
      })
      .catch(err => console.log('TAG DELETE ERROR: ', err));
    } 
  }

  componentDidMount() {
    this.initializeCheckboxes(this.props.peopleTags);
  }

  render() {
    const {settIsOpen, isAuthed, currentUser} = this.props;
    

    console.log("SETTINGS CURRENT USER: ", currentUser);

    if(!isAuthed) {
      this.handleLoginRedirect();
    }

    if(!settIsOpen) {
      return null;
    }

    if(settIsOpen) {
      window.addEventListener('keydown', this.handleKeyDown);
    }

    console.log("SETTINGS CURRENT STATE: ", this.state);
    console.log("PEOPLE TAGS: ", this.props.peopleTags);
    return (
      <div className="modal-backdrop">
        <div className="modal" display="block" id="settings-modal">
          <div className="modal-header">
            <h5>Profile: {currentUser.username}</h5>
            <button className="close" onClick={this.handleModalClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body container">
            <h5>People</h5>
            <ModalTagForm
              peopleTags={this.state.newPeopleTags ? this.state.newPeopleTags : this.props.peopleTags}
              checkboxes={this.state.checkboxes}
              onChange={this.handleCheckboxChange}
              onSubmit={this.handleTagFormSubmit}
            />
            <h5>Add people</h5>
            {this.state.prsnErrorMsg ? 
            <ModalError 
              errorMsg={this.state.prsnErrorMsg}
              handleCloseMsg={this.handleClosePrsnError}
            /> : 
            null}
            {this.state.prsnSuccessMsg ? 
            <ModalSuccess 
              successMsg={this.state.prsnSuccessMsg}
              handleCloseMsg={this.handleClosePrsnMsg}
            /> : 
            null}
            <form>
              <div className="form-group">
                <label htmlFor="newPersonFN">First name</label>
                <input type="text" className="form-control" id="newPersonFN" name="newPersonFN" onChange={this.handleFormChange} value={this.state.newPersonFN} />
              </div>
              <div className="form-group">
                <label htmlFor="newPersonLN">Last name</label>
                <input type="text" className="form-control" id="newPersonLN" name="newPersonLN" onChange={this.handleFormChange} value={this.state.newPersonLN} />
              </div>
              <button className="btn btn-dark" type="submit" onClick={this.handleNewPerson}>Add</button>
            </form>
            <h5 className="mt-3">Send invites</h5>
            {this.state.errorMsg ? 
            <ModalError 
              errorMsg={this.state.errorMsg}
              handleCloseMsg={this.handleCloseError}
            /> : 
            null}
            {this.state.successMsg ? 
            <ModalSuccess 
              successMsg={this.state.successMsg}
              handleCloseMsg={this.handleCloseMsg}
            /> : 
            null}
            <form>
              <div className="form-group">
                <label htmlFor="inviteFormEmail">Email address</label>
                <input type="email" className="form-control" id="inviteFormEmail" name="inviteEmail" placeholder="name@example.com" onChange={this.handleFormChange} value={this.state.inviteEmail} />
              </div>
              <div className="form-group">
                <label htmlFor="inviteFormAccessLevel">Access level</label>
                <select className="form-control" id="inviteFormAcccessLevel" name="accessLevel" onChange={this.handleFormChange}>
                  <option>Friend/Family</option>
                  <option>Collaborator</option>
                </select>
              </div>
              <button className="btn btn-dark" type="submit" onClick={this.handleNewUserInvite}>Invite</button>
            </form>
          </div>    
        </div>
      </div>
    );
  }
}

export default withRouter(ModalSettings);