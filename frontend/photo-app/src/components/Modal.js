import React from 'react';
import ReactDOM from 'react-dom';
import ModalMainPhoto from './ModalMainPhoto';
import ModalSettings from './ModalSettings';

function Modal(props) {
  if(props.photoIsOpen) {
    return ReactDOM.createPortal(<ModalMainPhoto {...props} />, document.querySelector('#modal'));
  } else if(props.settIsOpen) {
    return ReactDOM.createPortal(<ModalSettings {...props} />, document.querySelector('#modal'));
  }
  return null;
}

export default Modal;