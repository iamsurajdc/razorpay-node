const router = require('express').Router();
const api = require('./controller');
const auth = require('../common/authentication');

// Middle layer for User API
router.post('/login', api.login);
router.get('/userDetails',auth.parseSSO, api.userDetails);
router.get('/userDetails_V2',auth.parseSSO, api.userDetails_V2);
router.post('/createRazorpayOrder', api.createRazorpayOrder);
router.post('/capturePayment', api.capturePayment);
module.exports = router;
