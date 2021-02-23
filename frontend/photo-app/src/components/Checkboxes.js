import React from 'react';


const Checkbox = ({ label, isSelected, onChange }) => {
  console.log("CHECKBOX COMPONENT CHECKED? ", isSelected);
  return (
    <div>
      <label
        className="form-check-label"
        htmlFor={'inlineCheckboxPhotoModal' + '-' + label}
      >
        <input 
          className="form-check-input"
          type="checkbox"
          id={'inlineCheckboxPhotoModal' + '-' + label}
          value={label}
          name="editedPersonTags"
          onChange={onChange}
          checked={isSelected}
        />
          {label}
      </label>
    </div>
  );
}

export default Checkbox;