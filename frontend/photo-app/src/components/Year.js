import React, { Component } from 'react';
import PropTypes from "prop-types";
import Photos from './Photos';


class Year extends Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    photos: PropTypes.array,
    showPhotoModal: PropTypes.func
  };

  render() {

    let yearArray = [];
    let finalYearArray = [];
    let photosByYears = {};

    for (let i = 0; i < this.props.photos.length; i++) {
      const fullDate = this.props.photos[i].date_taken;
      const year = fullDate.split(':')[0].split('-')[0];
      yearArray.push(year);
    }

    for (let j = 0; j < yearArray.length; j++) {
      if (!finalYearArray.includes(yearArray[j])) {
        finalYearArray.push(yearArray[j]);
      }
    }

    for (let x = 0; x < finalYearArray.length; x++) {
      let photosForYear = [];
      this.props.photos.map(photo => {
        if (photo.date_taken.split(':')[0].split('-')[0] === finalYearArray[x]) {
          photosForYear.push(photo);
        }
      });
      photosByYears[finalYearArray[x]] = photosForYear;
    }

    return (
      
      <div className="year grid">
        {finalYearArray.map( year => (
          <div key={year}>
            <h3 id="photo-year">{year}</h3>
            <div className="photo-year-div" key={year + "-photo-div"}>
              <Photos yearPhotos={photosByYears[year]} showPhotoModal={this.props.showPhotoModal} />
            </div>
          </div>
        ))}

      </div>
    );
  }
}

export default Year;