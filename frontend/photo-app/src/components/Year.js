import React from 'react';
import Photos from './Photos';

const Year = (props) => {
    let yearArray = [];
    let finalYearArray = [];
    let photosByYears = {};

    for(let i = 0; i < props.photos.length; i++) {
      const fullDate = props.photos[i].date_taken;
      const year = fullDate.split(':')[0].split('-')[0];
      yearArray.push(year);
    }

    for(let j = 0; j < yearArray.length; j++) {
      if(!finalYearArray.includes(yearArray[j])) {
        finalYearArray.push(yearArray[j]);
      }
    }

    for(let x = 0; x < finalYearArray.length; x++) {
      let photosForYear = [];
      for(let p = 0; p < props.photos.length; p++) {
        if(props.photos[p].date_taken.split(':')[0].split('-')[0] === finalYearArray[x]) {
          photosForYear.push(props.photos[p]);
        }
      }
      photosByYears[finalYearArray[x]] = photosForYear;
    }

    return (
      <div className="year grid">
        {finalYearArray.map( year => (
          <div key={year}>
            <h3 id="photo-year">{year}</h3>
            <div className="photo-year-div" key={year + "-photo-div"}>
              <Photos yearPhotos={photosByYears[year]} showPhotoModal={props.showPhotoModal} />
            </div>
          </div>
        ))}
      </div>
    );
};

export default Year;