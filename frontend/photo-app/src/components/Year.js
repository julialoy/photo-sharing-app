import React, { Component } from 'react';
import Masonry from 'react-masonry-component';
import PropTypes from "prop-types";

const masonryOptions = {
  transitionDuration: 0,
  columnWidth: 100,
  itemSelector: '.image-element-class',
  gutter: 1,
  horizontalOrder: true
};

const imagesLoadedOptions = {
  background: 'pink'
};

class Year extends Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    photos: PropTypes.array,
    showPhotoModal: PropTypes.func
  };
  render() {
    // console.log("PHOTOS PROP: ", this.props.photos);
    const childElements = this.props.photos.map(photo => (
      //<li className="image-element-class">
        <img className="image-element-class" key={photo.filename} src={photo.web_size_loc} alt="" onClick={() => this.props.showPhotoModal(photo.full_size_loc)} />
      //</li>
    ));
    return (
      <div className="year grid">
        <h3>2020 Year Placeholder</h3>
{/*         <div className="month grid" data-masonry-options='{"itemSelector": ".grid-item", "columnWidth": "100", "horizontalOrder": "false"}'>
          {this.props.photos.map(photo => (
            <img 
              key={photo.filename} 
              className="photo grid-item" 
              src={photo.web_size_loc} 
              alt="" 
              onClick={() => this.props.showPhotoModal(photo.full_size_loc)}
            />
          ))}
        </div> */}
        <Masonry
          className={'my-gallery-class'}
          elementType={'ul'}
          options={masonryOptions}
          disableImagesLoaded={false}
          updateOnEachImageLoad={true}
          imagesLoadedOptions={imagesLoadedOptions}
        > 
          {childElements} 
        </Masonry>
      </div>
    );
  }
}

export default Year;