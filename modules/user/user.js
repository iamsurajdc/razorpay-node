// const con = require('../database/mysql');
const util = require('util');
// const query = util.promisify(con.query).bind(con);
const functions = require('../common/functions');
const config = require('../../config');
const validator = require('validator');
const code = require('../common/code');
const message = require('../common/message');
const fs = require('fs');
const Razorpay = require("razorpay");


class UserService {

  async userDetails_V2(info) {
    //console.log('TCL: UserService -> userDetails -> info', info);
    try {
      // var {
      //   userid,
      //   role,
      //   FirstName,
      //   LastName,
      //   EmailAddress,
      //   BuildingId,
      //   BuildingName,
      //   OccupancyId,
      //   UnitName,
      //   IsMgmtUnit
      // } = info;
      var userid = info.userid;
      var role = info.role;
      var FirstName = info.FirstName;
      var LastName = info.LastName;
      var EmailAddress = info.EmailAddress;
      var BuildingId = info.BuildingId == undefined ? info.BuildingID : info.BuildingId;
      var BuildingName = info.BuildingName;
      var OccupancyId = info.OccupancyId;
      var UnitName = info.UnitName;
      var IsMgmtUnit = info.IsMgmtUnit;

      //Manage Role 
      if (role == 'Management' || role == 'Maintenance' || role == 'Front Desk' || role == 'Public Terminal' || role == 'Other Attendant / Employee') {
        role = 'Admin';
      }

      // RoleID 2 is resident
      var userRoleId = (role == 'Admin') ? 1 : 2;
      //console.log("userRoleId",userRoleId);
      if (role == 'Admin' || role == 'Resident') {

        //Get userId from tbluser
        const sqlQuery = 'SELECT Id FROM tbluser where RefUserId = ?  and RoleID = ?';
        const resultList = await query(sqlQuery, [userid, userRoleId]);

        // query for getting details of Admin for token generation

        const sqlQuery1 = `select ? as Role, USR.Id, USR.Email, USR.FirstName, USR.LastName,USR.ImgUrl,USR.Phone,USR.UserAddr,
        BLD.Id as BuildingID, BLD.Title as BuildingName, BLD.RefBuildingId,USR.RefUserId,
         USR. RefOccupancyID,USR.RefUnitName
        from tbluser as USR 
        inner join tbluserbuilding as UBLD on USR.Id = UBLD.UserId
        inner join tblbuilding as BLD on BLD.Id = UBLD.BuildingID 
        where USR.Id =? `;


        if (resultList.length > 0) {
          const resultList1 = await query(sqlQuery1, [role, resultList[0].Id]);
          const token = await functions.tokenEncrypt(resultList1[0]);
          const userDetails = {
            userInfo: resultList1[0],
            token: token
          };
          return {
            code: code.success,
            message: message.success,
            data: userDetails
          };
        } else {
          try {
            //console.log("inside Else");
            const inserttblUser = `INSERT into tbluser (RefUserId, FirstName , LastName , Email ,
            RoleID, RefOccupancyID , RefUnitName)
            VALUES (?,?,?,?,?,?,?)`;
            const resultInsertUser = await query(inserttblUser, [userid, FirstName, LastName, EmailAddress,
              userRoleId, OccupancyId, UnitName
            ]);

            // Check if Building Name Exist with same refUserId
            const checkBldUser = 'SELECT Id from tblbuilding where RefBuildingId = ? ';
            const resultBldUser = await query(checkBldUser, [BuildingId]);

            if (!resultBldUser.length) {
              const inserttblBuilding = `INSERT into tblbuilding (RefBuildingId , Title )
            VALUES (?,?)`;
              const resulttblBuilding = await query(inserttblBuilding, [BuildingId, BuildingName]);
              return (await functions.insertForMapping(resulttblBuilding.insertId, resultInsertUser.insertId, role));
            }

            return (await functions.insertForMapping(resultBldUser[0].Id, resultInsertUser.insertId, role));

          } catch (e) {

            return {
              code: code.invalidDetails,
              message: message.tryCatch,
              data: e
            };
          }
        }
      }
    } catch (e) {

      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }


  }



  /**
   * API for user login
   * @param {*} req (email address & password)
   * @param {*} res (json with success/failure)
   */
  async login(info) {
    try {
      const {
        Email,
        Password
      } = info;
      if (validator.isEmail(Email)) {
        const sqlQuery =
          'SELECT Id,Email,FirstName,Password,ImgUrl,RoleID, LastName,Phone,UserAddr FROM tblUser WHERE TRIM(Email) = ? AND IsDeleted != 1';
        const loginDetails = await query(sqlQuery, [Email]);
        try {
          if (loginDetails.length > 0) {
            const password = functions.decryptPassword(loginDetails[0].Password);
            if (password === Password) {
              delete loginDetails[0].Password;
              const token = await functions.tokenEncrypt(loginDetails[0]);

              const userDetails = {
                userInfo: loginDetails[0],
                token
              };
              return {
                code: code.success,
                message: message.success,
                data: userDetails
                // token: token

              };
            } else {
              return {
                code: code.invalidDetails,
                message: message.invalidLoginDetails,
                data: []
              };
            }
          } else {
            return {
              code: code.invalidDetails,
              message: message.invalidLoginDetails,
              data: []
            };
          }
        } catch (error) {
          return {
            code: code.dbCode,
            message: message.dbError,
            data: error
          };
        }
      } else {
        return {
          code: code.invalidDetails,
          message: message.invalidLoginDetails,
          data: []
        };
      }
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  /**
   * Creates order under razorpay
   * @param {info: 
   *      amount*,
        currency,
        receipt*,
        payment_ca  pture,
        notes} info 
   */
  async createRazorpayOrder(info) {
    try {
      const {
        amount,
        currency,
        receipt,
        payment_capture,
        notes
      } = info;
      if (amount && receipt) {

        var instance = new Razorpay({
          key_id: `${config.RAZORPAY_KEY_ID}`,
          key_secret: `${config.RAZORPAY_SECRET}`
        })

        const order = await instance.orders.create({
          amount,
          currency,
          receipt,
          payment_capture,
          notes
        });
        console.log("UserService -> createRazorpayOrder -> order", order);
        // localStorage.setItem("order", order);

        if (order.status === "created") {

          // const sql = `INSERT into tbluser (, FirstName , LastName , Email ,
          //   RoleID, RefOccupancyID , RefUnitName)
          //   VALUES (?,?,?,?,?,?,?)`;
          // const params = [];

          // const res = await query(sql, params);
          // console.log("UserService -> createRazorpayOrder -> res", res);

          return {
            code: code.success,
            message: message.success,
            data: order

          };
        } else {
          return {
            code: code.invalidDetails,
            message: message.invalidDetails,
            data: []
          };
        }
      }
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

  async capturePayment(info) {
    try {

        const { amount, payment_id } = info

      if (amount&& payment_id ) {

        var instance = new Razorpay({
          key_id: `${config.RAZORPAY_KEY_ID}`,
          key_secret: `${config.RAZORPAY_SECRET}`
        })

        const paymentCaptured = await instance.payments.capture(payment_id, amount);
        console.log("UserService -> capturePayment -> paymentCaptured", paymentCaptured)
        console.log("UserService -> capturePayment -> paymentCaptured", paymentCaptured)
        

        if (paymentCaptured) {

          return {
            code: code.success,
            message: message.success,
            data: paymentCaptured

          };
        } else {
          return {
            code: code.invalidDetails,
            message: message.invalidDetails,
            data: []
          };
        }
      }  else {
        return {
          code: code.invalidDetails,
          message: message.invalidDetails,
          data: []
        };

      }
    } catch (e) {
      return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
      };
    }
  }

}

// LOOP TO KEEP MYSQL CONNECTION ALIVE
PingMySQL();

function PingMySQL() {

  query('SELECT 1 FROM tbluser', function (err, rows) {
    //console.log("WAKER CALLED");
  });
  setTimeout(PingMySQL, 600000);
}


module.exports = {
  userService: function () {
    return new UserService();
  }
};