let aws = require('aws-sdk')
let isReserved = require('./_is-reserved')

module.exports = function _put ({ appname, update }, params, callback) {

  // only the following namespaces allowed
  let allowed = [
    'testing',
    'staging',
    'production'
  ]

  // the params we expect
  let ns = params[1]
  let key = params[2]

  // the state we expect them in
  let valid = {
    ns: allowed.includes(ns),
    key: /[A-Z|_]+/.test(key) && !isReserved(key),
  }

  // blow up if something bad happens otherwise write the param
  if (!valid.ns) {
    callback(Error(`Invalid argument: environment can only be one of: testing, staging or production`))
  }
  else if (!valid.key) {
    callback(Error('Invalid argument: key must be all caps (and can contain underscores)'))
  }
  else {
    update.start(`Removing ${key} from ${ns} environment`)
    let ssm = new aws.SSM({ region: process.env.AWS_REGION })
    ssm.deleteParameter({
      Name: `/${appname}/${ns}/${key}`,
    },
    function done (err) {
      if (err && err.code === 'ParameterNotFound') {
        update.done(`Env var ${key} not found in ${ns} environment`)
        callback()
      }
      else if (err) {
        update.cancel()
        callback(err)
      }
      else {
        update.done(`Removed ${key} from ${ns} environment`)
        callback()
      }
    })
  }
}
