import React from 'react';
import Checkbox from './Checkboxes';

const createCheckboxes = (props) => {
  return (
    props.peopleTags.map(tag => 
      <Checkbox 
        label={tag.person_first_name} 
        isSelected={props.checkboxes[tag.person_first_name]} 
        key={tag.person_first_name + '-checkbox-key'}
        onChange={props.handleCheckboxChange}
      />
    )
  )
}

const ModalEditForm = (props) => {
  return (
    <form className="edit-date-form form-inline" onSubmit={props.handleSubmit}>
      <div className="form-group mx-3">
        {props.editFormIsOpen ? createCheckboxes(props) : null}
      </div>
      <div className="form-group mx-3">
        <textarea 
          className="form-control form-control-sm" 
          type="text" 
          rows="2" 
          defaultValue={props.editedDesc ? props.editedDesc : props.photoDesc} 
          name="editedDesc" 
          id="photoDesc" 
          onChange={props.handleFormChange}
        ></textarea>
      </div>
      <div className="form-group mx-3">
        <input 
          className="form-control form-control-sm" 
          type="date" 
          defaultValue={props.editedDate ? props.editedDate : props.photoDate} 
          min="1800-01-01" 
          max="2050-01-01" 
          name="editedDate" 
          id="date" 
          onChange={props.handleFormChange} 
        />
      </div>
      <div className="form-group mx-3" id="photo-form-btn">
        <button className="btn btn-dark" type="submit">Save</button>
      </div>
      <div className="form-group mx-3" id="photo-cancel-btn">
        <i className="fas fa-pencil-alt"></i>
        <button className="btn btn-dark" type="button" onClick={props.handleFormClose}>Cancel</button>
      </div>
    </form>
  );
}

export default ModalEditForm;