import React, { Component } from "react";
import { withRouter } from "react-router-dom";

class ConfirmLogin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      password: "",
      confirmPassword: ""
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(evt) {
    this.setState({
      [evt.target.name]: evt.target.value
    });
  }

  handleSubmit() {
    console.log("SUBMIT");
  }

  render() {
    const {email, password, confirmPassword} = this.state;
    return (
      <div id="confirmLoginBody" className="text-center">
        <form id="confirmLoginForm" className="form-signin" onSubmit={this.handleSubmit}>
          <h1 className="h4 mb-3 font-weight-normal">
            Please enter your email and create a password
          </h1>
          <label htmlFor="inputEmail" className="sr-only">
            Email address
          </label>
          <input type="email" id="inputEmail" className="form-control" placeholder="Email" name="email" value={email} onChange={this.handleChange} required autoFocus />
          <label htmlFor="inputPassword" className="sr-only">
            Password
          </label>
          <input type="password" id="inputPassword" className="form-control" placeholder="Password" name="password" value={password} onChange={this.handleChange} required />
          <label htmlFor="confirmPassword" className="sr-only">
            Confirm password
          </label>
          <input type="password" id="confirmPassword" className="form=control" placeholder="Confirm password" name="confirmPassword" value={confirmPassword} onChange={this.handleChange} required />
        </form>
      </div>
    );
  }
}

export default withRouter(ConfirmLogin);