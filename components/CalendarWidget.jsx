// src/components/CalendarWidget.jsx

import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ICAL from 'ical.js';
import TitleOnlyEvent from './TitleOnlyEvent';

const localizer = momentLocalizer(moment);

const CalendarWidget = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false); // State to track dark mode

  useEffect(() => {
    // Initialize isDarkMode based on current system theme
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);

    // Cleanup function to remove the event listener (if any)
      return () => {
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleThemeChange);
    }
  };
  }, []);

  useEffect(() => {
      .then((response) => response.text())
      .then((icsData) => {
        const jcalData = ICAL.parse(icsData);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents("vevent");
        const parsedEvents = [];
        const startRange = moment().startOf("month").toDate();
        const endRange = moment().add(13, "years").endOf("month").toDate();

        vevents.forEach((vevent) => {
          const event = new ICAL.Event(vevent);
          if (event.isRecurring()) {
            const iterator = event.iterator();
            const duration = event.endDate
              ? event.endDate.toJSDate() - event.startDate.toJSDate()
              : 0;
            let nextOccurrence;
            while (
              (nextOccurrence = iterator.next()) &&
              nextOccurrence.toJSDate() <= endRange
            ) {
              const occurrenceStart = nextOccurrence.toJSDate();
              if (occurrenceStart >= startRange) {
                parsedEvents.push({
                  title: event.summary || "No Title",
                  start: occurrenceStart,
                  end: new Date(occurrenceStart.getTime() + duration),
                  description: event.description || "No description available",
                  location: event.location || "No location provided",
                });
              }
            }
          } else {
            parsedEvents.push({
              title: event.summary || "No Title",
              start: event.startDate.toJSDate(),
              end: event.endDate ? event.endDate.toJSDate() : null,
              description: event.description || "No description available",
              location: event.location || "No location provided",
            });
          }
        });
        setEvents(parsedEvents);
      })
      .catch((error) => console.error("Error parsing ICS feed:", error));
  }, []);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  const renderLocation = (location) => {
    if (/^https?:\/\//i.test(location)) {
  return (
        <a href={location} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>
          {location}
        </a>
  );
    }
    return location;
};

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "10px",
  };

  const popupStyle = {
    backgroundColor: isDarkMode ? "#333" : "#fff",
    padding: "12px 16px",
    borderRadius: "6px",
    width: "100%",
    maxWidth: "350px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
    fontFamily: "Arial, sans-serif",
    color: isDarkMode ? "#eee" : "#333",
    textAlign: "left",
    lineHeight: "1.4",
  };

  return (
    <div>
      <div style={{ height: 600, margin: "20px auto" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable={true}
          onSelectEvent={handleSelectEvent}
          style={{ height: "100%" }}
          components={{
            event: TitleOnlyEvent,
            month: { event: TitleOnlyEvent },
            week: { event: TitleOnlyEvent },
            day: { event: TitleOnlyEvent },
          }}
        />
      </div>

      {selectedEvent && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <h2 style={{ color: isDarkMode ? "#eee" : "#333", margin: "0 0 8px 0", fontSize: "18px" }}>{selectedEvent.title}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "14px" }}>
              <p style={{ margin: 0, color: isDarkMode ? "#eee" : "#333" }}>
                <strong>Start:</strong> {selectedEvent.start.toLocaleString()}
              </p>
              {selectedEvent.end && (
                <p style={{ margin: 0, color: isDarkMode ? "#eee" : "#333" }}>
                  <strong>End:</strong> {selectedEvent.end.toLocaleString()}
                </p>
              )}
              <p style={{ margin: 0, color: isDarkMode ? "#eee" : "#333" }}>
                <strong>Location:</strong> {renderLocation(selectedEvent.location)}
              </p>
              <p>{selectedEvent.description}</p>
            </div>
            <button
              onClick={closeModal}
              style={{
                backgroundColor: "#0070f3",
                color: "#fff",
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                marginTop: "12px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarWidget;