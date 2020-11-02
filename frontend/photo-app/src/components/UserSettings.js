import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';

class Settings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      inviteEmail: "",
      accessLevel: "",
      errorMsg: "",
      successMsg: ""
    };

    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleSettingsModalClose = this.handleSettingsModalClose.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
    this.handleNewUserInvite = this.handleNewUserInvite.bind(this);
    this.handleCloseError = this.handleCloseError.bind(this);
    this.handleCloseMsg = this.handleCloseMsg.bind(this);
  }

  handleLoginRedirect() {
    this.props.history.push("/login");
  }

  handleKeyDown(e) {
    if (e.keyCode === 27) {
      this.handleSettingsModalClose();
    }
  }

  handleSettingsModalClose() {
    this.props.onClose();
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleFormChange(evt) {
    this.setState({
      [evt.target.name]: evt.target.value
    });
  }

  handleNewUserInvite(evt) {
    evt.preventDefault();
    const inviteEmail = this.state.inviteEmail;
    let accessLevel = this.state.inviteEmail;

    if (inviteEmail === "") {
      this.setState({
        errorMsg: "Invalid email provided. Cannot send invite."
      });
    }

    if (accessLevel === "") {
      accessLevel = "Friend/Family";
    }

    axios.post("http://localhost:8080/invite",
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
      if (response.data.invite_sent) {
        this.setState({
          successMsg: "Invite sent."
        });
      }
    })
    .catch(err => console.log("INVITE ERROR: ", err));
  }

  handleCloseError() {
    this.setState({
      errorMsg: ""
    });
  }

  handleCloseMsg() {
    this.setState({
      successMsg: ""
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
    console.log("SETTINGS CURRENT USER: ", currentUser);
    if (!isAuthed) {
      this.handleLoginRedirect();
    }

    if (show) {
      window.addEventListener('keydown', this.handleKeyDown);
    }

    if (!show) {
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
            <h5>Send invites</h5>
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
    )
  }
}

export default withRouter(Settings);