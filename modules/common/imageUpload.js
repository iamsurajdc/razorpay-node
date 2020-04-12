const fs = require('fs');
const path = require('path');
const mime = require('mime');
const uuidv4 = require('uuid/v4');

//function to decode base64 image data
function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }
  // console.log("matches",matches[0])
  // console.log("matches",matches) ;
  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
}

//function to upload image data to server
function upload(imageLink) {
  var uploadPath = path.normalize(process.cwd() + '/public/uploads/');

  var decodedImg = decodeBase64Image(imageLink);
  // console.log("decodedImg",decodedImg);
  var imageBuffer = decodedImg.data;
  var type = decodedImg.type;
  // console.log("type",type)
  var fileNameAppend = type.split("/")[0] ;
  console.log("fileNameAppend",fileNameAppend) ;
  var extension = mime.getExtension(type);

  // var fileName = value + '.' + extension;
  var fileName = uuidv4() + '-' + fileNameAppend + '.' + extension;
  console.log("fileName",fileName);
  // var imgURL = `/uploads/` + fileName;
  // var imgURL = `/public/uploads/` + Date.now()+'-' +fileName ;
  var imgURL = `/public/uploads/`+fileName ;

  try {
    const checkvalue = fs.writeFileSync(uploadPath + fileName, imageBuffer, 'utf8');
    return imgURL;
  } catch (error) {
    return error.message;
  }
}
function uploadPdf(arrayBuffer) {
  var uploadPath = path.normalize(process.cwd() + '/public/uploads/');

  //var decodedImg = decodeBase64Image(imageLink);
  // console.log("decodedImg",decodedImg);
  // var imageBuffer = decodedImg.data;
  // var type = decodedImg.type;
  // console.log("type",type)
  // var fileNameAppend = type.split("/")[0] ;
  // console.log("fileNameAppend",fileNameAppend) ;
  // var extension = mime.getExtension(type);

  // var fileName = value + '.' + extension;
  // var fileName = uuidv4() + '-' + fileNameAppend + '.' + extension;
  // console.log("fileName",fileName);
  // var imgURL = `/uploads/` + fileName;
  // var imgURL = `/public/uploads/` + Date.now()+'-' +fileName ;
  // var imgURL = `/public/uploads/`+fileName ;

  try {
    const checkvalue = fs.writeFileSync(uploadPath+'imp.pdf', new Buffer(arrayBuffer));
    return true;
  } catch (error) {
    return error.message;
  }
}

module.exports = {upload,
uploadPdf};
