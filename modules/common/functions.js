const con = require('../database/mysql');
const config = require('../../config');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const upload = require('../common/imageUpload');  
const uploadFile = require('../common/imageUpload');
const status = config.env;


const util = require('util');
const query = util.promisify(con.query).bind(con);
const code = require('../common/code');
const message = require('../common/message');
const _ = require('lodash');

/**
 * Function for Encrypting the data
 * @param {*} data (data to encrypt)
 * @param {*} return (encrypted data)
 */
function encryptData(data) {
  if (status === 'development') {
    return { encResponse: data };
  } else {
    var dataString = JSON.stringify(data);
    var response = CryptoJS.AES.encrypt(dataString, config.cryptokey);
    return { encResponse: response.toString() };
  }
}

/**
 * Function for decrypting the data
 * @param {*} data (data to decrypt)
 * @param {*} return (decrypt data)
 */
function decryptData(data) {
  if (status === 'development') {
    return data;
  } else {
    var decrypted = CryptoJS.AES.decrypt(data, config.cryptokey);
    if (decrypted) {
      var userinfo = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      return userinfo;
    } else {
      return { userinfo: { error: 'Please send proper token' } };
    }
  }
}

/**
 * Function for Encrypting the password
 * @param {*} data (data to encrypt)
 * @param {*} return (encrypted data)
 */
function encryptPassword(data) {
  var response = CryptoJS.AES.encrypt(data, config.tokenkey);
  return response.toString();
}

/**
 * Function for decrypting the password
 * @param {*} data (data to decrypt)
 * @param {*} return (decrypt data)
 */
function decryptPassword(data) {
  var decrypted = CryptoJS.AES.decrypt(data, config.tokenkey);
  if (decrypted) {
    var userinfo = decrypted.toString(CryptoJS.enc.Utf8);
    return userinfo;
  } else {
    return { userinfo: { error: 'Please send proper token' } };
  }
}



/**
 * Function for encryting the userId with session
 * @param {*} data (data to encrypt)
 * @param {*} return (encrypted data)
 */
async function tokenEncrypt(data) {
  var token = await jwt.sign({ data: data }, config.tokenkey); // { expiresIn: 20 * 60 } Expires in 20 minutes
  return token;
}

/**
 * Function for decryting the userId with session
 * @param {*} data (data to decrypt)
 * @param {*} return (decrypted data)
 */
async function tokenDecrypt(data) {
  try {
    const decode = await jwt.verify(data, config.tokenkey);
    return decode;
  } catch (error) {
    return error;
  }
}

/**
 * Function for creating response
 * @param {*} data (status, data, token)
 * @param {*} return (encrypted data)
 */
function responseGenerator(code, message, data = '') {
  var details = {
    status: { code: code, message: message },
    result: data
  };


  return details;
  if (status === 'development') {
  } else {
    return encryptData(details);
  }
}

/**
 * Function for sending email
 * @param {*} data (to, sub)
 * @param {*} return (decrypted data)
 */
async function sendEmail(to, subject, message) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.SMTPemailAddress,
      pass: config.SMTPPassword
    }
  });

  var mailOptions = {
    from: 'developers.winjit@gmail.com',
    to: to,
    subject: subject,
    html: message
  };

  try {
    const smsDetails = await transporter.sendMail(mailOptions);
    return smsDetails;
  } catch (error) {
    return error;
  }
}

/**
 * Function to randomly generate string
 * param
 * return (err, result)
 */
function generateRandomString(callback) {
  var referralCode = randomstring.generate({
    length: 9,
    charset: 'alphanumeric',
    capitalization: 'uppercase'
  });

  callback(referralCode);
}


async function insertForMapping( userBuildingID , userID , role) {
  // Insert Into tbluserbuilding
  const insertMapping = 'INSERT into tbluserbuilding ( BuildingID, UserID) VALUES (?,?)';
  const resultInsertMapping = await query(insertMapping , [ userBuildingID , userID ]);

  // query for getting details of Admin for token generation
  const getDetailsUser = `select ? as Role, USR.Id, USR.Email, USR.FirstName, USR.LastName,USR.ImgUrl,USR.Phone,USR.UserAddr,
  BLD.Id as BuildingID, BLD.Title as BuildingName, BLD.RefBuildingId,USR.RefUserId,
   USR. RefOccupancyID,USR.RefUnitName
  from tbluser as USR 
  inner join tbluserbuilding as UBLD on USR.Id = UBLD.UserId
  inner join tblbuilding as BLD on BLD.Id = UBLD.BuildingID 
  where USR.Id =? `;
  const resultgetDetailsUser = await query( role , getDetailsUser, [userID]);

  const token = await tokenEncrypt(resultgetDetailsUser[0]);
  
  const userDetails = {
    userInfo: resultgetDetailsUser[0],
    token: token
  };
  return {
    code: code.success,
    message: message.success,
    data: userDetails
  };
}



async function insertData(userId , ProviderID , ProviderServiceId, data , req){
  try {

    console.log("inside insertData");
    const serviceInfo = data.serviceInfo ; // object of serviceInfo
    const customerQuestion = data.customerQuestion ; // array of customerInfo
    const productList = data.productList ; // array of productInfo
    const checkList = data.checkList ; // array of checkList
    var InsertServiceCheckListGlobal ; 
    
     //INSERT INTO tblchecklist

    for (let item = 0; item <checkList.length ; item++){

        if (checkList[item]) // Checking if checkList is empty or not
        {

            console.log("item",checkList[item]) ; 
            var sql_InsertServiceCheckList = 'INSERT INTO tblservicechecklist(ProviderServiceID,ItemDescription,CreatedBy,UpdatedBy)' +
            ' VALUES (?,?,?,?)';

            const InsertServiceCheckList = await query(sql_InsertServiceCheckList, [ ProviderServiceId ,  checkList[item].checkListName, userId, userId]);
            InsertServiceCheckListGlobal = InsertServiceCheckList ;
             
        }
    }    


    // INSERT INTO Service Product Table
   

    // if( req.files && req.files[1] && req.files[1].mimetype == ('application/pdf' ||
    //   'application/msword' || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')){
    //     index = 2 ;
    //   }

    for (let product=0; product<productList.length; product++)
    {  
        if (productList[product].productName) // Checking Edge Case if Product Name is empty as its optional
        {
              // if (req.files[product+index]){
              //   filePath = req.files[product+index].path ;
              // }
              // else{
              //     filePath = "null";
              // }
              var filePath ;
              if (productList[product].productImgURL=="null" || productList[product].productImgURL==null || productList[product].productImgURL==''){
                filePath = "null" ;
              }
              else{
                if(productList[product].productImgURL.split && productList[product].productImgURL.split("/")[1] != "public" ){
                  filePath = uploadFile.upload(productList[product].productImgURL) ;
                }
                else{
                  filePath = productList[product].productImgURL ;
                }
              }
          
          var sql_InsertServiceProducts = 'INSERT INTO tblserviceproducts (ProviderServiceID , Name , minPrice , maxPrice , productImgURL ,CreatedBy,UpdatedBy)'  +
            ' VALUES (?,?,?,?,?,?,?)';
            const InsertServiceProducts = await query(sql_InsertServiceProducts, [ ProviderServiceId , productList[product].productName, productList[product].minPrice,productList[product].maxPrice,filePath, userId, userId]);
        }
    }    
        

     // INSERT INTO Service Question Table

    for (let question=0; question<customerQuestion.length; question++)
    {
       if (customerQuestion[question].QuestionTitle) // Checking Edge case if title is empty or not 
       {
        var sql_InsertQuestion = 'INSERT INTO tblservicequestions (ProviderServiceID , QuestionTitle , QuestionType , isRequired , CreatedBy,UpdatedBy )'  +
        ' VALUES (?,?,?,?,?,?)' ;
        const InsertQuestion = await query (sql_InsertQuestion , [ProviderServiceId , customerQuestion[question].QuestionTitle , customerQuestion[question].QuestionType , customerQuestion[question].QuestionIsRequired, userId , userId ]) ;

        const ServiceQuestionId = InsertQuestion.insertId ;

        if (customerQuestion[question].QuestionChoices.length != 0) // Check if choices are null 
        {

            const Choices = customerQuestion[question].QuestionChoices ;

            for (  let choice=0; choice < Choices.length; choice++ ) {

                var sql_InsertQuestionChoice = 'INSERT INTO tblservicequestionchoice (ServiceQuestionID , QuestionChoiceData , QuestionRefData , CreatedBy,UpdatedBy )' +
                ' VALUES (?,?,?,?,?)' ;
                const InsertQuestionChoice = await query (sql_InsertQuestionChoice , [ServiceQuestionId , Choices[choice].choiceName , 'NULL' , userId , userId ]) ;
                }

        }

       }   
    }

    return {
        code: code.success,
        message: message.ServiceCreated,
        data: InsertServiceCheckListGlobal
    };
 
} catch (e) {

    return {
        code: code.invalidDetails,
        message: message.tryCatch,
        data: e
    };
}
}




function getRoleofVisitor(visitorRole) {

  if (arrResident.includes(visitorRole))
    return 'Resident';
  else if (arrAdmin.includes(visitorRole))
    return 'Admin';
  else
    return 'Error';
}




var arrAdmin = ["Management",
  "On-site Manager",
  "Off-site Manager",
  "Resident Manager",
  "Site Admin",
  "Security Officer",
  "Maintenance",
  "Superintendent",
  "Maintenance Manager",
  "Building Engineer",
  "Handyman",
  "Front Desk",
  "Concierge",
  "Doorman",
  "Porter",
  "Other Attendant / Employee",
  "Package Room Attendant	",
  "Elevator Person	",
  "Parking Attendant",
  "Maintenance Only",
  "Package and Maintenance	",
  "Public Terminal",
  "Public Display",
  "In/Out Grid",
  "TimeTracker Console",
  "Car Valet",
  "Aware Display",
  "Aware Device"
];

var arrResident = [
  "Occupant",
  "Owner",
  "Leaseholder",
  "Shareholder",
  "Homeowner",
  "Co-owner",
  "Renter",
  "Sponsor-owner",
  "Tenant",
  "Resident",
  "Member Owner",
  "Client",
  "Lease Assignor",
  "Lease Assignee",
  "Personal Assistant",
  "Commercial Owner",
  "Corporate Renter",
  "Power of Attorney",
  "Board - Phase 1",
  "Board - Phase 2",
  "Commercial Tenant",
  "Certified Public Accountant",
  "Multiple Unit Owner",
  "Property Manager",
  "Board - Phase 3",
  "Offsite Shareholder",
  "Leaseholder (absentee)",
  "Non-Resident Owner",
  "Offsite Owner",
  "Agent/Broker",
  "Other Top-Level Occupant",
  "Family Member – Spouse",
  "Family Member – Child",
  "Family Member – Other",
  "Live-in Help",
  "Roommate",
  "Other Occupant",
  "Guarantor",
  "Agent/Broker",
  "Guest",
  "Offsite Owner",
  "Family Member-Sibling",
  "Architects/Contractors",
  "Dependent",
  "Occupant",
  "Parking Unit Owner",
  "Sponsor Tenant",
  "Short Term Resident",
  "Live-Out Help",
  "Parking Owner",
  "Parking Renter",
  "Partner",
  "Personal Assistant",
  "Sub-Occupant",
  "Primary Sub-Occupant",
  "Subtenant",
  "Sub-lessee",
  "Sublettor",
  "Renter",
  "Tenant",
  "Resident",
  "Corporate Renter",
  "Co-Resident",
  "Occupant",
  "Co-Occupant",
  "Personal Assistant",
  "Commercial Tenant",
  "Guarantor",
  "Family Member – Spouse",
  "Family Member – Child",
  "Family Member – Other",
  "Live-in Help",
  "Roommate",
  "Other Occupant",
  "Short Term Resident",
  "Parking Renter",
  "Partner"
];




module.exports = {
  encryptData,
  decryptData,
  encryptPassword,
  decryptPassword,
  tokenEncrypt,
  tokenDecrypt,
  responseGenerator,
  sendEmail,
  generateRandomString,
  insertData,
  insertForMapping,
  getRoleofVisitor
};
