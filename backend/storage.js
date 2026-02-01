/**
 * In-memory event storage
 * MVP only - data lost on restart
 * 
 * EVENT STATUSES:
 * - observed: Action happened on Web2 platform, not yet cryptographically verified
 * - verified: Signature verified, user confirmed ownership
 * - paid: Tip was sent successfully (has txHash)
 */

const events = [];
const tippingConfigs = new Map(); // walletAddress -> config
const paymentRecords = new Map(); // eventId -> payment data

/**
 * Add new event
 * @param {object} event - Event data
 * @returns {object} - Event with ID and timestamp
 */
export const addEvent = (event) => {
  const eventWithId = {
    id: events.length + 1,
    ...event,
    createdAt: new Date().toISOString()
  };
  events.push(eventWithId);
  return eventWithId;
};

/**
 * Get all events
 * @returns {array} - All events
 */
export const getAllEvents = () => {
  return events;
};

/**
 * Get event by ID
 * @param {number} id - Event ID
 * @returns {object|null} - Event or null
 */
export const getEventById = (id) => {
  return events.find(e => e.id === id) || null;
};

/**
 * Update event (for status transitions: observed → verified → paid)
 * @param {number} id - Event ID
 * @param {object} updates - Fields to update
 * @returns {object|null} - Updated event or null
 */
export const updateEvent = (id, updates) => {
  const index = events.findIndex(e => e.id === id);
  if (index === -1) return null;
  
  events[index] = {
    ...events[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  return events[index];
};

/**
 * Get event count
 * @returns {number}
 */
export const getEventCount = () => {
  return events.length;
};

/**
 * Get events by status
 * @param {string} status - 'observed', 'verified', or 'paid'
 * @returns {array} - Filtered events
 */
export const getEventsByStatus = (status) => {
  return events.filter(e => e.status === status);
};

/**
 * Get events by wallet address
 * @param {string} walletAddress - Wallet address
 * @returns {array} - User's events
 */
export const getEventsByWallet = (walletAddress) => {
  return events.filter(e => 
    e.walletAddress && 
    e.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
};

// ===== TIPPING CONFIG STORAGE =====

/**
 * Save tipping config for a wallet
 * @param {string} walletAddress - Wallet address
 * @param {object} config - Tipping configuration
 */
export const saveTippingConfig = (walletAddress, config) => {
  tippingConfigs.set(walletAddress.toLowerCase(), {
    ...config,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Get tipping config for a wallet
 * @param {string} walletAddress - Wallet address
 * @returns {object|null} - Config or null
 */
export const getTippingConfig = (walletAddress) => {
  return tippingConfigs.get(walletAddress.toLowerCase()) || null;
};

/**
 * Delete tipping config
 * @param {string} walletAddress - Wallet address
 */
export const deleteTippingConfig = (walletAddress) => {
  tippingConfigs.delete(walletAddress.toLowerCase());
};

// ===== PAYMENT RECORDS =====

/**
 * Record a payment for an event
 * @param {number} eventId - Event ID
 * @param {object} paymentData - Payment details {txHash, amount, token, timestamp}
 */
export const recordPayment = (eventId, paymentData) => {
  paymentRecords.set(eventId, {
    ...paymentData,
    recordedAt: new Date().toISOString()
  });
};

/**
 * Get payment record for an event
 * @param {number} eventId - Event ID
 * @returns {object|null} - Payment data or null
 */
export const getPaymentRecord = (eventId) => {
  return paymentRecords.get(eventId) || null;
};

/**
 * Check if event has been paid
 * @param {number} eventId - Event ID
 * @returns {boolean}
 */
export const isEventPaid = (eventId) => {
  return paymentRecords.has(eventId);
};
