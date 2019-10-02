'use strict';

const User = require('./users-model.js');
let usedTokens = [];

module.exports = async (req, res, next) => {
  
  try {
    let [authType, authString] = req.headers.authorization.split(/\s+/);
    
    switch( authType.toLowerCase() ) {
      case 'basic': 
        return _authBasic(authString);
      case 'bearer':
        try {
          return await _authBearer(authString);
        }
        catch(err) {
          console.log('In catch');
          return _authError();
        }
      default: 
        return _authError();
    }
  }
  catch(err) {
    return _authError();
  }
  
  
  function _authBasic(token) {
    // str: am9objpqb2hubnk=
    let base64Buffer = Buffer.from(token, 'base64'); // <Buffer 01 02 ...>
    let bufferString = base64Buffer.toString();    // john:mysecret
    let [username, password] = bufferString.split(':'); // john='john'; mysecret='mysecret']
    let auth = {username,password}; // { username:'john', password:'mysecret' }
    
    return User.authenticateBasic(auth)
      .then(user => {
        _authenticate(user); 
      })
      .catch(next);
  }

  async function _authBearer(token) {
    let user = await User.authenticateToken(token);
    if(usedTokens.includes(token)) {
      console.log('Before throw');
      throw "Token Has Already Been Used";
    } else {
      usedTokens.push(token);
    }
    return _authenticate(user);
  }

  async function _authenticate(user) {
    if(user) {
      req.user = user;
      req.token = user.generateToken();

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