import React, { PureComponent } from 'react';
import Checkbox from './Checkboxes';

class PeopleForm extends PureComponent {
  constructor(props) {
    super(props);

    this.createTagCheckboxes = this.createTagCheckboxes.bind(this);
  }

  // Checkbox value needs to be set via prop to be uncontrolled?
  createTagCheckboxes() {
    return (
      this.props.peopleTags.map(tag => 
        <Checkbox
          value={tag.person_first_name} 
          label={tag.person_first_name}
          isSelected={this.props.checkboxes[tag.person_first_name]}
          key={`${tag.person_first_name}-setting-checkbox-key`}
          onChange={this.props.onChange}
        />
      )
    );
  }

  render() {
    const {userAccessLevel} = this.props;
    const tagDeleteBtn = <div className="form-group mx-3" id="setting-form-btn"><button className="btn btn-dark" type="submit">Delete</button></div>;

    return (
      <form className="edit-tag-form form-inline" onSubmit={this.props.onSubmit}>
        <div className="form-group mx-3">
          {this.createTagCheckboxes()}
        </div>
        {userAccessLevel === "primary" ? tagDeleteBtn : null}
        <div className="form-group mx-3" id="setting-form-filter">
          <button className="btn btn-dark" type="button" onClick={this.props.onClick}>Filter</button>
        </div>
      </form>
    );
  }
}

export default PeopleForm;