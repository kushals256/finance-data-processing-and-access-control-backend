module.exports = async function globalTeardown() {
  if (global.__MONGOSERVER__) {
    await global.__MONGOSERVER__.stop();
  }
};
