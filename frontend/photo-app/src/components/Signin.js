// From YouTube tutorial
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "axios";

class Signin extends Component {
  constructor(props) {
    super(props);
    this.userEmailInput = React.createRef();
    this.userPasswordInput = React.createRef();

    this.state = {
      email: "",
      password: "",
      signinErrors: ""
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleIndexRedirect = this.handleIndexRedirect.bind(this);
  }

  static propTypes = {
    handleSuccessfulAuth: PropTypes.func
  };
  
  handleIndexRedirect() {
    this.props.history.push("/");
  }

  handleChange(evt) {
    this.setState({
      [evt.target.name]: evt.target.value
    });
  }

  handleSubmit(evt) {
    evt.preventDefault();
    const {
      email,
      password,
    } = this.state;

    const {
      handleSuccessfulAuth
    } = this.props;

    axios.post("http://localhost:8080/login", 
        {
          user: {
            email: email,
            password: password
          }
        }, 
        {withCredentials: true},
      )
      .then(response => {
        if (response.data.logged_in) {
          handleSuccessfulAuth(response.data);
          console.log(response.data)
          this.handleIndexRedirect();
        }
      })
      .catch(error => {
        console.log("login error:", error);
      });
    // Reset form after submit
    this.setState({
      email: "",
      password: ""
    })
  }
  
  render() {
    const {
      email,
      password
    } = this.state;
    return (
      <div id="loginBody" className="text-center">
        <form id="loginForm" className="form-signin" onSubmit={this.handleSubmit}>
          <img className="mb-4" src="../static/android-chrome-192x192.png" alt="" width="72" height="72"/>
          <h1 className="h4 mb-3 font-weight-normal">Please log in</h1>
          <label htmlFor="inputEmail" className="sr-only">Email address</label>
          <input type="email" id="inputEmail" className="form-control" placeholder="Email" name="email" value={email} onChange={this.handleChange} required autoFocus />
          <label htmlFor="inputPassword" className="sr-only">Password</label>
          <input type="password" id="inputPassword" className="form-control" placeholder="Password" name="password" value={password} onChange={this.handleChange} required />
          <div className="checkbox mb-3">
            <label>
              <input type="checkbox" value="remember-me" /> Remember me
            </label>
          </div>
          <button className="btn btn-lg btn-dark btn-block" type="submit" id="loginSubmit">Log in</button>
          <p>No account? <a href="/register">Register!</a></p>
        </form>
      </div>
    )
  }
}


export default withRouter(Signin);