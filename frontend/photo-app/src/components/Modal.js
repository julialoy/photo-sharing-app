import React from 'react';
import ReactDOM from 'react-dom';
import ModalMainPhoto from './ModalMainPhoto';

function Modal(props) {
  return ReactDOM.createPortal(<ModalMainPhoto {...props} />, document.querySelector('#modal'));
}

export default Modal;