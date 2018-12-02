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
 * Error: The provided token has expired.
 * @returns {undefined}
 */
function expiredToken() {
  sessionStorage.accessKeyId = "";
  sessionStorage.secretAccessKey = "";
  sessionStorage.sessionToken = "";
  sessionStorage.expired = "";
  console.log('User signed out.');
  // window.location.replace("/home/index.html");
}

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {
  
  this.$onInit = function () {
    const permisos = getAccess();
    $scope.bucket = bucket;
    $scope.key = 'private/content-types/json/content-types.json';
    
    var fileParams = {Bucket: $scope.bucket, Key: $scope.key};
    s3 = new AWS.S3();
    s3.getObject(fileParams, function (errGetObject, fileData) {
      if (errGetObject) {
        if (debug) console.log('El fichero ' + $scope.key + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        //window.location.replace("/home/index.html");
        // expiredToken();
      } else {
        var file = JSON.parse(fileData.Body.toString('utf-8'));
        $scope.cts = file;
        $scope.$apply();
      }
    });
  }
  

  $scope.eliminar = function (id) {
    const permisos = getAccess();
    var confirmar = confirm('¿Estás seguro?');
    if (confirmar) {
      console.log('encontrado en la posicion: ' + id);
      if (id > -1) {
        $scope.cts.splice(id, 1);
        const file = JSON.stringify($scope.cts);
         // (Buffer, Typed Array, Blob, String, ReadableStream) Object data.
        s3 = new AWS.S3();
        var paramsObject = { Bucket: $scope.bucket, Key: $scope.key, Body: file };
        s3.putObject(paramsObject, function (errSavingFile, dataPutObject) {
          if (errSavingFile) {
            if (debug) console.log('El fichero ' + $scope.key + ' NO existe en el bucket o no tiene permisos.');
            if (debug) console.log('Error guardando el fichero')
            if (debug) console.log(errSavingFile);
            expiredToken();
          } else {
            if (debug) console.log('Fichero guardado correctamente');
            if (debug) console.log(dataPutObject);
          }
        });
      }             
    }
  };
});