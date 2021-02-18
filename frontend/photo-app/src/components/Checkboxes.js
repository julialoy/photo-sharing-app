import React, { Component } from 'react';

class Checkboxes extends Component {
  constructor(props) {
    super(props);

  }

  render() {
    console.log("RETURNING A CHECKBOX ELEMENT");
    return (
      <React.Fragment>
        <input 
          className="form-check-input"
          type="checkbox"
          id={'inlineCheckboxPhotoModal' + '-' + this.props.label}
          value={this.props.label}
          key={this.props.key}
          name="editedPersonTags"
          onChange={this.props.onChange}
          checked={this.props.isSelected}
        />
        <label
          className="form-check-label"
          htmlFor={'inlineCheckboxPhotoModal' + '-' + this.props.label}
          key={this.props.key + '-label-key'}
        >
          {this.props.label}
        </label>
      </React.Fragment>
    );
  }
}

export default Checkboxes;