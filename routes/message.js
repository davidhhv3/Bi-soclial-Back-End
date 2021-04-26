var express = require('express');
var MessageController = require('../controllers/message');
api = express.Router();
var md_auth = require('../middlewares/authenticated');

api.get('/probando-md',md_auth.ensureAuth,MessageController.probando);
api.post('/message',md_auth.ensureAuth,MessageController.saveMessage);
api.get('/my-messages/:page?',md_auth.ensureAuth,MessageController.getReceivedMessages);
api.get('/messages/:page?',md_auth.ensureAuth,MessageController.getEmmitMessages);
api.get('/unviewed-message/',md_auth.ensureAuth,MessageController.getUnviewedMessages);
api.get('/set-viewed-messages/',md_auth.ensureAuth,MessageController.saveViewedMessage);


module.exports = api;