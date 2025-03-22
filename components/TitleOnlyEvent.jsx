// TitleOnlyEvent.js
import React from 'react';

const TitleOnlyEvent = ({ event }) => {
  return (
    <span
      title={event.title}
      style={{ whiteSpace: 'normal', fontSize: '12px' }}
    >
      {event.title}
    </span>
  );
};

export default TitleOnlyEvent;

