const functions = require('./functions');
const code = require('./code');
const message = require('./message');
const request = require('request');
var jwtDecode = require('jwt-decode');

const authenticationController = {
  validateToken: async (req, res, next) => {
    try {
      if (req.headers.auth) {
        const tokenDecryptInfo = await functions.tokenDecrypt(req.headers.auth);
        console.log('res.data', tokenDecryptInfo.data)
        if (tokenDecryptInfo.data) {
          res.locals.tokenInfo = tokenDecryptInfo.data;
          const token = await functions.tokenEncrypt(tokenDecryptInfo.data);
          res.header('auth', token);
          next();
        } else {
          res.send(functions.responseGenerator(code.sessionExpire, message.sessionExpire));
        }
      } else {
        res.send(functions.responseGenerator(code.invalidDetails, message.tokenMissing));
      }
    } catch (e) {
      console.log(e);
      res.send(functions.responseGenerator(code.invalidDetails, message.tryCatch, e));
    }
  },

  decryptRequest: (req, res, next) => {
    try {
      if (req.body.encRequest) {
        const userinfo = functions.decryptData(req.body.encRequest);
        res.locals.requestedData = userinfo;
        next();
      } else {
        res.send(functions.responseGenerator(code.invalidDetails, message.dataIssue));
      }
    } catch (e) {
      console.log(e);
      res.send(functions.responseGenerator(code.invalidDetails, message.tryCatch, e));
    }
  },


  parseSSO: async (req, res, next) => {
    try {
      if (req.query.data) {
        request('http://survey.buildinglink.com:8081/api/values?encrypted_data=' + req.query.data, function (error, response, plainbody) {
          plainbody = JSON.parse(plainbody);
          res.locals.ssoData = plainbody;
          next();
        });
      } else if (req.query.OAuthToken) {
        var decoded = jwtDecode(req.query.OAuthToken);

        console.log("decoded",JSON.stringify(decoded));
        if(JSON.parse(decoded.user_type) && JSON.parse(decoded.property) && JSON.parse(decoded.unit_occupancy))
        {

          var datamapping = {
            "userid": decoded.sub,
            "role": functions.getRoleofVisitor(JSON.parse(decoded.user_type).name),
            "FirstName": decoded.given_name,
            "LastName": decoded.family_name,
            "EmailAddress": "",
            "BuildingId": JSON.parse(decoded.property).id,
            "BuildingName": JSON.parse(decoded.property).name,
            "OccupancyId": JSON.parse(decoded.unit_occupancy).id,
            "UnitName": JSON.parse(decoded.unit_occupancy).name,
            "IsMgmtUnit": false,
            "TimeStamp": "2019-07-18T07:18:39.7015937Z"
          } ;
  
          res.locals.ssoData =JSON.stringify(datamapping);
          next();
        }
        else{
          res.send(functions.responseGenerator(code.invalidDetails, message.oAuthdataIssue));
        }
        

      } else {
        res.send(functions.responseGenerator(code.invalidDetails, message.dataIssue));
      }
    } catch (e) {
      console.log(e);
      res.send(functions.responseGenerator(code.invalidDetails, message.tryCatch, e));
    }
  }
};

module.exports = authenticationController;