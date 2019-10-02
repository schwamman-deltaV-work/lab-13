'use strict';

process.env.SECRET='test';

const jwt = require('jsonwebtoken');

const server = require('../../../src/app.js').server;
const supergoose = require('../../supergoose.js');

const mockRequest = supergoose(server);

let users = {
  admin: {username: 'admin', password: 'password', role: 'admin'},
  editor: {username: 'editor', password: 'password', role: 'editor'},
  user: {username: 'user', password: 'password', role: 'user'},
};


describe('Auth Router', () => {
  
  Object.keys(users).forEach( userType => {
    
    describe(`${userType} users`, () => {
      
      let encodedToken;
      let id;
      let savedToken;
      
      it('can create one', () => {
        return mockRequest.post('/signup')
          .send(users[userType])
          .expect(200)
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET);
            id = token.id;
            encodedToken = results.text;
            expect(token.id).toBeDefined();
            expect(token.role).toBeDefined();
          });
      });

      it('can signin with basic', () => {
        return mockRequest.post('/signin')
          .auth(users[userType].username, users[userType].password)
          .expect(200)
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET);
            expect(token.id).toEqual(id);
            expect(token.role).toBeDefined();

            savedToken = results.text;
          });
      });

      it('can signin with bearer token', async () => {
        expect(savedToken).toBeDefined();
        expect(savedToken).not.toBe('');
  
        let response = await mockRequest
          .post('/signin')
          .set('Authorization', `Bearer ${savedToken}`)
          .expect(200);
  
        var token = jwt.decode(response.text);
        expect(token.id).toEqual(id);
        expect(token.role).toBeDefined();
      });
    });  
  });
});