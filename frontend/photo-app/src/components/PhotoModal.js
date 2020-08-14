import React, { Component } from 'react';
import PropTypes from 'prop-types';

class PhotoModal extends Component {

  static propTypes = {
    onClose: PropTypes.func,
    fullPhoto: PropTypes.string
  };


  render() {

    const {show, onClose, fullPhoto} = this.props;

    if (!this.props.show) {
      return null;
    }

    return (
       <div className="modal-backdrop">
        <div className="modal" display="block" id="photo-modal">
          <div>
          <div>
            <div className="modal-header">
              <button className="close" onClick={onClose}>
                  x
              </button>
              </div>
              <div className="modal-body">
                <img className="full-size-photo" src={fullPhoto} alt="" />

              </div>
              <div className="modal-footer">
                <button className="btn btn-dark" onClick={onClose}>Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default PhotoModal;