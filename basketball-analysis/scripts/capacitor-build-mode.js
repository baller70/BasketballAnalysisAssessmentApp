function getCapacitorBuildMode(env = process.env) {
  return env.CAPACITOR_STATIC_BUILD === 'true' ? 'static-export' : 'remote-shell';
}

module.exports = { getCapacitorBuildMode };
