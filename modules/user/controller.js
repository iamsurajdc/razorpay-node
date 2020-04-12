const userObject = require('./user');
const functions = require('../common/functions');


const userController = {

  //Login API  
  login: async (req, res) => {
    try {
      const loginDetails = await userObject.userService().login(req.body);
      res.send(
        functions.responseGenerator(loginDetails.code, loginDetails.message, loginDetails.data)
      );
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },

  createRazorpayOrder: async (req, res) => {
    try {
      const result = await userObject.userService().createRazorpayOrder(req.body);
      res.send(
        functions.responseGenerator(result.code, result.message, result.data)
      );
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },

  capturePayment: async (req, res) => {
    try {
      const result = await userObject.userService().capturePayment(req.body);
      res.send(
        functions.responseGenerator(result.code, result.message, result.data)
      );
    } catch (error) {
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },

  userDetails: async (req, res) => {
    try {
      // READ FROM MIDDLEWARE
      var ssoData = res.locals.ssoData;
      // console.log("ssoData",ssoData);
      const loginDetails = await userObject.userService().userDetails(JSON.parse(ssoData));
      res.send(
        functions.responseGenerator(
          loginDetails.code,
          loginDetails.message,
          loginDetails.data)
      );
    } catch (error) {
      console.log('ERROR IN SSO-  :', error);
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  },
  userDetails_V2: async (req, res) => {
    try {
      // READ FROM MIDDLEWARE
      var ssoData = res.locals.ssoData;
      const loginDetails = await userObject.userService().userDetails_V2(JSON.parse(ssoData));
      res.send(
        functions.responseGenerator(
          loginDetails.code,
          loginDetails.message,
          loginDetails.data)
      );
    } catch (error) {
      console.log('ERROR IN SSO-  :', error);
      res.send(functions.responseGenerator(error.code, error.message, error.data));
    }
  }

};

module.exports = userController;