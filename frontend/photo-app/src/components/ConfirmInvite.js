import React, { Component } from "react";
import { Redirect, withRouter } from "react-router-dom";
import axios from "axios";

class ConfirmInvite extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      inviteCode: "",
      inviteSucceeded: false,
      password: "",
      confirmPassword: "",
      successMsg: "",
      errorMsg: ""
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleCloseErrorMsg = this.handleCloseErrorMsg.bind(this);
    this.handleCloseSuccessMsg = this.handleCloseSuccessMsg.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handlePasswordSubmit = this.handlePasswordSubmit.bind(this);
  }

  handleChange(evt) {
    this.setState({
      [evt.target.name]: evt.target.value
    });
  }

  handleCloseErrorMsg() {
    this.setState({
      errorMsg: ""
    });
  }

  handleCloseSuccessMsg() {
    this.setState({
      successMsg: ""
    });
  }

  handleSubmit(evt) {
    evt.preventDefault();
    console.log("ACCEPT INVITE");
    const {
      email,
      inviteCode
    } = this.state;

    axios.post("http://localhost:8080/register-invite",
      {
        inviteInfo: {
          email: email,
          code: inviteCode
        }
      },
      { withCredentials: true },
    )
    .then(response => {
      if (response.data) {
        console.log("INVITE CONFIRMATION DATA: ", response.data);
        this.setState({
          inviteSucceeded: true,
          successMsg: "Confirmation succeeded!"
        })
      } else {
        console.log("INVITE CONFIRMATION DATA: ", response.data);
        this.setState({
          errorMsg: "Something went wrong"
        });
      }
    })
    .catch(error => {
      console.log("INVITE CONFIRMATION ERROR: ", error);
    });
  }

  handlePasswordSubmit(evt) {
    evt.preventDefault();
    console.log("PASSWORD SUBMIT");
  }

  render() {
    const { email, inviteCode, inviteSucceeded, password, confirmPassword } = this.state;

    const errorDiv = <div className="alert alert-danger alert-dimissible fade show" role="alert">
      That email or code is incorrect.
      <button type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={this.handleCloseErrorMsg}>
        <span aria-hidden="true">&times;</span>
      </button>
    </div>

    const successDiv = <div className="alert alert-success alert-dismissible fade show" role="alert">
      { this.state.successMsg }
      <button type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={this.handleCloseSuccessMsg}>
        <span aria-hidden="true">&times;</span>
      </button>
    </div>

    const emailCodeDiv = <form id="confirmInviteForm" className="form-signin" onSubmit={this.handleSubmit}>
        <img className="mb-4" src="../static/android-chrome-192x192.png" alt="" width="71" height="72" />
        { this.state.errorMsg ? errorDiv : null }
        <h1 className="h4 mb-3 font-weight-normal">Please enter your email and invite code</h1>
        <label htmlFor="inputEmail" className="sr-only">Email address</label>
        <input type="email" id="inputEmail" className="form-control" placeholder="Email" name="email" value={email} onChange={this.handleChange} required autoFocus />
        <label htmlFor="inviteCode" className="sr-only">Invite code</label>
        <input type="inviteCode" id="inviteCode" className="form-control" placeholder="Invite code" name="inviteCode" value={inviteCode} onChange={this.handleChange} required />
        <button className="btn btn-lg btn-dark btn-block" type="submit" id="confirmInviteSubmit">Accept invite</button>
        <p>Already have an account? <a href="/login">Go here.</a></p>
    </form>


    const passwordDiv = <form id="passwordForm" className="form-signin" onSubmit={this.handlePasswordSubmit}>
        <img className="mb-4" src="../static/android-chrome-192x192.png" alt="" width="71" height="72" />
        { this.state.successMsg ? successDiv : null }
        <h1 className="h4 mb-3 font-weight-normal">Please create your password</h1>
        <label htmlFor="inputPassword" className="sr-only">Password</label>
        <input type="password" id="inputPassword" className="form-control" placeholder="Password" name="password" value={password} onChange={this.handleChange} required autoFocus />
        <label htmlFor="confirmPassword" className="sr-only">Confirm password</label>
        <input type="password" id="confirmPassword" className="form-control" placeholder="Confirm password" name="confirmPassword" value={confirmPassword} onChange={this.handleChange} required />
        <button className="btn btn-lg bnt-dark btn-block" type="submit" id="createPassword">Create password</button>
    </form>
    
    if (this.props.isAuthed === true){
      return <Redirect to="/" />
    }

    return (
      <div id="confirmInviteBody" className="text-center">
        { inviteSucceeded ? passwordDiv : emailCodeDiv }
      </div>
    )

  }
}

export default withRouter(ConfirmInvite);