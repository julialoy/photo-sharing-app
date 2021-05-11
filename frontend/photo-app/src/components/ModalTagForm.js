import React, { PureComponent } from 'react';
import Checkbox from './Checkboxes';

class PeopleForm extends PureComponent {
  constructor(props) {
    super(props);

    this.handleCreateTagChkbxs = this.handleCreateTagChkbxs.bind(this);
    this.createTagCheckboxes = this.createTagCheckboxes.bind(this);
  }

  // If no filter applied, checkboxes should be unchecked
  // If filter applied, filtered people should be checked
  handleCreateTagChkbxs(tagArray, areBoxesSelected) {
    return (
      this.props.peopleTags.map(tag =>
        <Checkbox 
          value={tag.person_first_name}
          label={tag.person_first_name}
          onChange={this.props.onChange}
          isSelected={areBoxesSelected ? tagArray.includes(tag.person_id) : false}
          key={`${tag.person_first_name}-setting-checkbox-key`}
        />
      )
    );
  }

  createTagCheckboxes() {
    if(this.props.filteredTags.length > 0) {
      console.log("PHOTOS ARE FILTERED: ", this.props.filteredTags);
      return this.handleCreateTagChkbxs(this.props.filteredTags, true);
    } else {
      console.log("PHOTOS ARE NOT FILTERED");
      return this.handleCreateTagChkbxs([], false);
    }
/*       return (
        this.props.peopleTags.map(tag => 
          <Checkbox
            value={tag.person_first_name} 
            label={tag.person_first_name}
            // isSelected={this.props.filteredTags ? this.props.filteredTags.includes(tag.person_id) : this.props.checkboxes[tag.person_first_name]}
            // isSelected={this.props.filteredTags.includes(tag.person_id)}
            key={`${tag.person_first_name}-setting-checkbox-key`}
            onChange={this.props.onChange}
          />
        )
      ); */
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
        <div className="form-group mx-3" id="setting-form-reset">
          <button className="btn btn-dark" type="button" onClick={this.props.handleResetFilter}>Reset</button>
        </div>
      </form>
    );
  }
}

export default PeopleForm;