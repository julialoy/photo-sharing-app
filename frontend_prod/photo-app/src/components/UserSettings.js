import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';

class Settings extends Component {
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
      prsnErrorMsg: ""
    };

    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleSettingsModalClose = this.handleSettingsModalClose.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
    this.handleNewPerson = this.handleNewPerson.bind(this);
    this.handleNewUserInvite = this.handleNewUserInvite.bind(this);
    this.handleCloseError = this.handleCloseError.bind(this);
    this.handleClosePrsnError = this.handleClosePrsnError.bind(this);
    this.handleCloseMsg = this.handleCloseMsg.bind(this);
    this.handleClosePrsnMsg = this.handleClosePrsnMsg.bind(this);
  }

  handleLoginRedirect() {
    this.props.history.push("/login");
  }

  handleKeyDown(e) {
    if(e.keyCode === 27) {
      this.handleSettingsModalClose();
    }
  }

  handleSettingsModalClose() {
    this.setState({
      inviteEmail: "",
      accessLevel: "Friend/Family",
      errorMsg: "",
      successMsg: "",
      inviteCode: "",
      newPersonFN: "",
      newPersonLN: "",
      prsnSuccessMsg: "",
      prsnErrorMsg: ""
    });
    this.props.onClose();
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleFormChange(evt) {
    this.setState({
      [evt.target.name]: evt.target.value
    });
  }

  handleNewPerson(evt) {
    evt.preventDefault();
    const firstName = this.state.newPersonFN;
    const lastName = this.state.newPersonLN;

    if(firstName.length === 0 && lastName.length === 0) {
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
        console.log("ADD PERSON RESPONSE: ", response.data);
        if(response.data.person_added) {
          this.setState({
            prsnSuccessMsg: `${firstName} ${lastName} added!`
          });
        } else {
          this.setState({
            prsnErrorMsg: `Unable to add ${firstName} ${lastName}.`
          });
        }
      })
      .catch(err => console.log("ADD PERSON ERROR: ", err));
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
        console.log("INVITE RESPONSE: ", response.data);
        if(response.data.invite_sent) {
          this.setState({
            successMsg: `Success! Use this code to invite your family or friend: ${response.data.invite_code}.`,
            inviteCode: response.data.invite_code
          });
        }
      })
      .catch(err => console.log("INVITE ERROR: ", err));
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

  render() {
    const {show, isAuthed, currentUser} = this.props;
    const errorMessage = <div className="alert alert-danger alert-dismissible fade show" role="alert">
      <button type="button" className="close" data-dismiss="alert" aria-label="close" onClick={this.handleCloseError}>
        <span>&times;</span>
      </button>
      {this.state.errorMsg}
    </div>
    const successMessage = <div className="alert alert-success alert-dismissible fade show" role="alert">
      <button type="button" className="close" data-dismiss="alert" aria-label="close" onClick={this.handleCloseMsg}>
        <span>&times;</span>
      </button>
      {this.state.successMsg}
    </div>
    const prsnErrorMessage = <div className="alert alert-danger alert-dismissible fade show" role="alert">
      <button type="button" className="close" data-dismiss="alert" aria-label="close" onClick={this.handleClosePrsnError}>
        <span>&times;</span>
      </button>
      {this.state.prsnErrorMsg}
    </div>
    const prsnSuccessMessage = <div className="alert alert-success alert-dismissible fade show" role="alert">
      <button type="button" className="close" data-dismiss="alert" aria-label="close" onClick={this.handleClosePrsnMsg}>
        <span>&times;</span>
      </button>
      {this.state.prsnSuccessMsg}
    </div>

    console.log("SETTINGS CURRENT USER: ", currentUser);

    if(!isAuthed) {
      this.handleLoginRedirect();
    }

    if(show) {
      window.addEventListener('keydown', this.handleKeyDown);
    }

    if(!show) {
      return null;
    }

    console.log("SETTINGS CURRENT STATE: ", this.state);
    return (
      <div className="modal-backdrop">
        <div className="modal" display="block" id="settings-modal">
          <div className="modal-header">
            <h5>Profile: {currentUser.username}</h5>
            <button className="close" onClick={this.handleSettingsModalClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body container">
            <h5>Add people</h5>
            {this.state.prsnErrorMsg ? prsnErrorMessage : null}
            {this.state.prsnSuccessMsg ? prsnSuccessMessage : null}
            <form>
              <div className="form-group">
                <label htmlFor="newPersonFN">First name</label>
                <input type="text" className="form-control" id="newPersonFN" name="newPersonFN" placeholder="Jamie" onChange={this.handleFormChange} />
              </div>
              <div className="form-group">
                <label htmlFor="newPersonLN">Last name</label>
                <input type="text" className="form-control" id="newPersonLN" name="newPersonLN" placeholder="Smith" onChange={this.handleFormChange} />
              </div>
              <button className="btn btn-dark" type="submit" onClick={this.handleNewPerson}>Add</button>
            </form>
            <h5 className="mt-3">Send invites</h5>
            {this.state.errorMsg ? errorMessage : null}
            {this.state.successMsg ? successMessage : null}
            <form>
              <div className="form-group">
                <label htmlFor="inviteFormEmail">Email address</label>
                <input type="email" className="form-control" id="inviteFormEmail" name="inviteEmail" placeholder="name@example.com" onChange={this.handleFormChange} />
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

export default withRouter(Settings);