/**
 * In-memory event storage
 * MVP only - data lost on restart
 */

const events = [];

export const addEvent = (event) => {
  const eventWithId = {
    id: events.length + 1,
    ...event,
    createdAt: new Date().toISOString()
  };
  events.push(eventWithId);
  return eventWithId;
};

export const getAllEvents = () => {
  return events;
};

export const getEventCount = () => {
  return events.length;
};
