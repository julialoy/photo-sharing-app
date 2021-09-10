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
  constructor(props) {
    super(props);

    this.createChildElements = this.createChildElements.bind(this);
  }

  createChildElements(elementArray) {
    let childArray = [];
    for(let x = 0; x < elementArray.length; x++) {
      if(elementArray[x].filename.split('.')[1] === 'mp4') {
        childArray.push(
          <video 
            className="image-element-class" 
            key={elementArray[x].filename} 
            onClick={() => this.props.showPhotoModal(elementArray[x])}
          >
            <source 
              className="image-element-class" 
              key={`${elementArray[x].filename}-src`} 
              type="video/mp4"
              // Change to web_size_filename from web_size_loc
              src={process.env.PUBLIC_URL + "/user_images/" + elementArray[x].web_size_filename}
            />
          </video>
        );
      } else {
        childArray.push(
          <img 
            className="image-element-class"
            key={elementArray[x].filename}
            // Change to web_size_filename from web_size_loc
            // src={process.env.PUBLIC_URL + elementArray[x].web_size_filename}
            src={process.env.PUBLIC_URL + "/user_images/" + elementArray[x].web_size_filename}
            alt=""
            onClick={() => this.props.showPhotoModal(elementArray[x])}
          />
        );
      }
    }
    return childArray;
  }

  render() {
    const childElements = this.createChildElements(this.props.yearPhotos);
    console.log("CHILD ELEMENTS: ", childElements);
    return (
      <Masonry
        className={"my-gallery-class"}
        elementType={"ul"}
        options={masonryOptions}
        disableImagesLoaded={false}
        updateOnEachImageLoad={true}
      > 
        {childElements} 
      </Masonry>
    );
  }
}

export default Photos;