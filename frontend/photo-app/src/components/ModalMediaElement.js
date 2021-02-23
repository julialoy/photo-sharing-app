import React from 'react';

const ModalMediaElement = (props) => {
  let returnElem;
  if (props.mediaType === 'mp4') {
    returnElem = (
      <video controls width="1000">
        <source src={props.fullPhoto} type="video/mp4" />
        Sorry, your browser doesn't support this video format.
      </video>
    );
  } else {
    returnElem = <img className="full-size-photo img-fluid" src={props.fullPhoto} alt="" />;
  }
  return returnElem;
}

export default ModalMediaElement;