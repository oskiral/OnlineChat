// Simple module to store and export the Socket.IO instance
let ioInstance = null;

function setIoInstance(io) {
  ioInstance = io;
}

function getIoInstance() {
  if (!ioInstance) {
    throw new Error('Socket.IO instance not initialized. Call setIoInstance() first.');
  }
  return ioInstance;
}

module.exports = {
  setIoInstance,
  getIoInstance
};
