import React, { Component } from 'react';
import PropTypes from "prop-types";

class Year extends Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    photos: PropTypes.array
  };

  render() {
    console.log("PHOTOS PROP: ", this.props.photos);
    return (
      <div className="Year">
        <h3>2020 Year Placeholder</h3>
        <div className="Month">
          {this.props.photos.map(photo => (
            <img key={photo.filename} className="photo" src={photo.url} alt="" /> 
          ))}
        </div>
      </div>
    );
  }
}

export default Year;