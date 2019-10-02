'use strict';

const User = require('./users-model.js');
let tokens = [];

module.exports = (req, res, next) => {
  
  try {
    let [authType, authString] = req.headers.authorization.split(/\s+/);
    
    switch( authType.toLowerCase() ) {
      case 'basic': 
        return _authBasic(authString);
      case 'bearer':
        return _authBearer(authString);
      default: 
        return _authError();
    }
  }
  catch(err) {
    return _authError();
  }
  
  
  function _authBasic(str) {
    // str: am9objpqb2hubnk=
    let base64Buffer = Buffer.from(str, 'base64'); // <Buffer 01 02 ...>
    let bufferString = base64Buffer.toString();    // john:mysecret
    let [username, password] = bufferString.split(':'); // john='john'; mysecret='mysecret']
    let auth = {username,password}; // { username:'john', password:'mysecret' }
    
    return User.authenticateBasic(auth)
      .then(user => _authenticate(user) )
      .catch(next);
  }

  async function _authBearer(str) {
    let user = await User.authenticateToken(str);
    return _authenticate(user);
  }

  async function _authenticate(user) {
    if(user) {
      req.user = user;
      req.token = user.generateToken();
      tokens.push(req.token);
      
      next();
    }
    else {
      await _authError();
    }
  }
  
  async function _authError() {
    res.set('WWW-Authenticate', 'basic');
    next({status: 401, statusMessage: 'Unauthorized', message: 'Invalid User ID/Password'});
  }
  
};