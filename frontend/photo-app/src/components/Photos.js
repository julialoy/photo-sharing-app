import React, { Component } from 'react';
import Masonry from 'react-masonry-component';

const masonryOptions = {
  transitionDuration: 0,
  columnWidth: 100,
  itemSelector: '.image-element-class',
  gutter: 1,
  horizontalOrder: false,
  fitWidth: true
};

class Photos extends Component {

  render() {
    console.log("IN PHOTOS COMPONENT: ", this.props.yearPhotos);
    const childElements = this.props.yearPhotos.map(photo => (
        <img 
          className="image-element-class" 
          key={photo.filename} 
          src={photo.web_size_loc} 
          alt="" 
          onClick={() => this.props.showPhotoModal(photo)}
        />
    ));
    return (
      <Masonry
        className={'my-gallery-class'}
        elementType={'ul'}
        options={masonryOptions}
        disableImagesLoaded={false}
        updateOnEachImageLoad={true}
      > 
          {childElements} 
      </Masonry>
    )
  }
}

export default Photos;