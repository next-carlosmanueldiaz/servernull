/**
 * Comprueba y recupera las credenciales de la sesión
 * @returns {Boolean}
 */
function getCredentials() {
  var debug = false;
  if (typeof (Storage) !== "undefined") {
    if (sessionStorage.accessKeyId && sessionStorage.secretAccessKey && sessionStorage.sessionToken && sessionStorage.expired) {
      var region = sessionStorage.region; // https://goo.gl/CLhMq3
      var credsData = {
        accessKeyId: sessionStorage.accessKeyId,
        secretAccessKey: sessionStorage.secretAccessKey,
        sessionToken: sessionStorage.sessionToken,
        expireTime: sessionStorage.expireTime,
        expired: sessionStorage.expired
      };
      var creds = new AWS.Credentials(credsData);
      AWS.config.update({region: region, credentials: creds});
      if (debug) console.log('Acceso condecido como administrador.');
      return true;
    }
  }
}

/**
 * Obtiene el valor de una variable pasada por GET
 * @param {type} variable
 * @returns {getQueryVariable.pair}
 */
function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  } 
  alert('Query Variable ' + variable + ' not found');
}

/**
 * Error: The provided token has expired.
 * @returns {undefined}
 */
function expiredToken() {
  sessionStorage.accessKeyId = "";
  sessionStorage.secretAccessKey = "";
  sessionStorage.sessionToken = "";
  sessionStorage.expired = "";
  console.log('User signed out.');
  window.location.replace("/index.html");
}

/**
 * Convierte un texto en slug
 * @param {type} text
 * @returns {unresolved}
 */
function slugify (text) {
  const a = 'àáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;'
  const b = 'aaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(p, c =>
        b.charAt(a.indexOf(c)))     // Replace special chars
    .replace(/&/g, '-and-')         // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '')             // Trim - from end of text
}

const debug = true;
const tengoAcceso = getCredentials();

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {
  
  this.$onInit = function () {
    $scope.bucket = sessionStorage.bucket;
    $scope.keyFile = 'backend/html.html';
    
    var fileParams = {Bucket: $scope.bucket, Key: $scope.keyFile};
    s3 = new AWS.S3();
    s3.getObject(fileParams, function (errGetObject, fileData) {
      if (errGetObject) {
        if (debug) console.log('El fichero ' + $scope.keyFile + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        // expiredToken();
      } else {
        var file = fileData.Body.toString('utf-8');
        $scope.html = file;
        $scope.$apply();
      }
    });
  }
  
  /**
   * SUBMIT FORMULARIO: 
   *  - guardamos los datos del fichero
   * 
   * @returns {undefined}
   */
  $scope.submit = function () {
    // Guardamos los datos del contenido en el fichero JSON
    var paramsObject = { Bucket: $scope.bucket, Key: $scope.keyFile, Body: $scope.html };
    s3.putObject(paramsObject, function (errSavingFile, dataPutObject) {
      if (errSavingFile) {
        if (debug) console.log('El fichero ' + $scope.keyFile + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log('Error guardando el fichero')
        if (debug) console.log(errSavingFile);
        expiredToken();
      } else {
        if (debug) console.log('Fichero guardado correctamente');
        if (debug) console.log(dataPutObject);
      }
    }); // / putObject('nuevo-contenido.json)
  }; // /submit
});