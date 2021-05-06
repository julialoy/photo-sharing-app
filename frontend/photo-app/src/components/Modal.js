import React from 'react';
import ReactDOM from 'react-dom';
import ModalMainPhoto from './ModalMainPhoto';
import ModalSettings from './ModalSettings';
import ModalUpload from './ModalUpload';

function Modal(props) {
  if(props.photoIsOpen) {
    return ReactDOM.createPortal(<ModalMainPhoto {...props} />, document.querySelector('#modal'));
  } else if(props.settIsOpen) {
    return ReactDOM.createPortal(<ModalSettings {...props} />, document.querySelector('#modal'));
  } else if(props.uploadIsOpen && props.currentUser.accessLevel === "primary") {
    return ReactDOM.createPortal(<ModalUpload {...props} />, document.querySelector('#modal'));
  }
  return null;
}

export default Modal;