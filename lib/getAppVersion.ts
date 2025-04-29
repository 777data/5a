import packageJson from '../package.json';

export function getAppVersion() {
  return packageJson.version;
}