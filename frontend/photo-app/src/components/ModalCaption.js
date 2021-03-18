import React from 'react';
import moment from 'moment';

const ModalCaption = (props) => {
  return (
    <React.Fragment>
      <span>
        {props.photoDesc}
      </span>
      <span>
        {moment(props.photoDate).format('dddd, MMM Do YYYY')}
      </span>
    </React.Fragment>
  );
}

export default ModalCaption;