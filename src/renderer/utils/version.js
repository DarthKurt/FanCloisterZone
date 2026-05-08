export function getAppVersion () {
  const argv = (typeof process !== 'undefined' && Array.isArray(process.argv))
    ? process.argv
    : ((typeof window !== 'undefined' && Array.isArray(window.process?.argv)) ? window.process.argv : [])

  const appVersionArg = argv.find(arg => arg.startsWith('--app-version='))
  if (appVersionArg) {
    return appVersionArg.replace('--app-version=', '')
  }

  if (typeof process !== 'undefined' && process.env?.npm_package_version) {
    return process.env.npm_package_version
  }

  return '0.0.0'
}
