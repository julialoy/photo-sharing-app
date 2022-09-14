import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';

class Register extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      password: "",
      passwordConfirmation: "",
      registrationErrors: ""
    }

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleIndexRedirect = this.handleIndexRedirect.bind(this);
    this.handleCloseErrorMsg = this.handleCloseErrorMsg.bind(this);
  }

  handleIndexRedirect() {
    this.props.history.push("/");
  }

  handleSubmit(e) {
    e.preventDefault();
    const {
      email,
      password,
      passwordConfirmation
    } = this.state; 
    if(password === passwordConfirmation) {
      axios.post("http://www.hoard.pics/register",
        {
          user: {
            email: email,
            password: password
          }
        },
        {withCredentials: true}
      )
      .then(response => {
        if(response.data.is_registered) {
          this.props.handleSuccessfulAuth(response.data);
          this.handleIndexRedirect();
          console.log(response.data);  
        } else if(response.data.error) {
          console.log(`else if ${response.data.error}`);
          this.setState({
            registrationErrors: response.data.error
          });
        } else {
          console.log(`else ${response.data}`);
        }
      })
      .catch(err => console.log(err));
    } else {
      console.log("Error: Password and password confirmation must match");
    }
    // Reset form after submit
    this.setState({
      email: "",
      password: "",
      passwordConfirmation: ""
    });
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  handleCloseErrorMsg() {
    this.setState({
      registrationErrors: ""
    });
  }
  
  render() {
    const errorDiv = <div className="alert alert-danger alert-dismissible fade show" role="alert">
      {this.state.registrationErrors}
      <button type="button" className="close" data-dissmiss="alert" aria-label="Close" onClick={this.handleCloseErrorMsg}>
        <span aria-hidden="true">
          &times;
        </span>
      </button>
    </div>;

    return (
      <div id="registerBody" className="text-center">
        <form id="registerForm" className="form-register" onSubmit={this.handleSubmit}>
          <img className="mb-4" src="../static/android-chrome-192x192.png" alt="" width="72" height="72" />
          {this.state.registrationErrors ? errorDiv : null}
          <label htmlFor="inputEmail" className="sr-only">
            Email address
          </label>
          <input 
            id="inputEmail"
            className="form-control"
            type="email" 
            name="email" 
            placeholder="Email" 
            value={this.state.email} 
            onChange={this.handleChange} 
            required 
            autoFocus  
          />
          <label htmlFor="inputPassword" className="sr-only">
            Password
          </label>
          <input 
            id="inputPassword"
            className="form-control"
            type="password"
            name="password"
            placeholder="Password"
            value={this.state.password}
            onChange={this.handleChange}
            required
          />
          <input
            id="confirmPassword"
            className="form-control"
            type="password"
            name="passwordConfirmation"
            placeholder="Password confirmation"
            value={this.state.passwordConfirmation}
            onChange={this.handleChange}
            required
          />
          <button id="registerSubmit" className="btn btn-lg btn-dark btn-block" type="submit">
            Register
          </button>
          <p>
            Already have an account? <a href="/login">Log in.</a>
          </p>
        </form>
      </div>
    );
  }
}

export default withRouter(Register);