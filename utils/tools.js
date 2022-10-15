const path = require('path')
const os = require('os')
const fs = require('fs')

async function sleep(time) {
  return await new Promise(r => setTimeout(r, time));
}

function responseError(res, err, statusCode) {
  res.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf8'
  });
  res.end(err.stack);
}

// ref: https://github.com/whistle-plugins/whistle.vase/blob/f12ca04abcf3991d8e6a4fe7633d1775898ad968/lib/util.js#L149
function __getHomeDir() {
  return (
    (typeof os.homedir == 'function'
      ? os.homedir()
      : process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']) ||
    '~'
  );
}
// ref: https://github.com/whistle-plugins/whistle.vase/blob/f12ca04abcf3991d8e6a4fe7633d1775898ad968/lib/data-mgr.js#L7
const STUNTMAN_DATA_ROOT = path.join(__getHomeDir(), '.StuntmanAppData');
/**
 * homeDirPath
 * @param {string} type 'saved',保存的已拦截请求内容;'mocks',保存的mock记录;('mocks'默认)
 */
function homeDirPath(type) {
  switch(type) {
    case 'saved':
      return path.join(STUNTMAN_DATA_ROOT, 'saved')
    case 'config':
      return path.join(STUNTMAN_DATA_ROOT, 'mocks', '.config.json')
    default: // case 'mocks':
      return path.join(STUNTMAN_DATA_ROOT, 'mocks', 'data.json')
  }
}
function initDataDir() {
  if(!fs.existsSync(STUNTMAN_DATA_ROOT)) {
    fs.mkdirSync(STUNTMAN_DATA_ROOT)
  }
  if(!fs.existsSync(path.join(STUNTMAN_DATA_ROOT, 'saved'))) {
    fs.mkdirSync(path.join(STUNTMAN_DATA_ROOT, 'saved'))
  }
  if(!fs.existsSync(path.join(STUNTMAN_DATA_ROOT, 'mocks'))) {
    fs.mkdirSync(path.join(STUNTMAN_DATA_ROOT, 'mocks'))
  }
  // if(!fs.existsSync(path.join(STUNTMAN_DATA_ROOT, 'mocks', 'data.json'))) {
  //   fs.writeFileSync(path.join(STUNTMAN_DATA_ROOT, 'mocks', 'data.json'), "{}")
  // }
}

module.exports = {
  sleep,
  responseError,
  homeDirPath,
  initDataDir
}