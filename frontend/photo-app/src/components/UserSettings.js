import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

class Settings extends Component {
  constructor(props) {
    super(props);

    this.handleLoginRedirect = this.handleLoginRedirect.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleSettingsModalClose = this.handleSettingsModalClose.bind(this);
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

  render() {
    const {show, isAuthed, currentUser} = this.props;
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
            <p>Placeholder text</p>
          </div>    
        </div>
      </div>
    )
  }
}

export default withRouter(Settings);