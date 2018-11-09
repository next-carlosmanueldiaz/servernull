/**
 * Comprueba y recupera las credenciales de la sesión
 * @returns {Boolean}
 */
function getCredentials() {
  var debug = true;
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
  console.log('User signed out.'); 
  // window.location.replace("/home/index.html");
}

/**
 * Finaliza la sesión de google
 * @returns {undefined}
 */
function signOut(e) {
  e.preventDefault();
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
    sessionStorage.accessKeyId = "";
    sessionStorage.secretAccessKey = "";
    sessionStorage.sessionToken = "";
    sessionStorage.expired = "";
    console.log('User signed out.');
  });
}

/**
 * Genera un slug de un texto dado. 
 * 
 * @param String text
 * @returns String
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

// const debug = true;
// const tengoAcceso = getCredentials();

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {
  
  this.$onInit = function () {
    const permisos = getAccess();

    $scope.bucket = bucket;
    $scope.key = 'home/content/json/contents.json';
    
    s3 = new AWS.S3();
    var fileParams = { Bucket: $scope.bucket, Key: $scope.key };
    s3.getObject(fileParams, function (errGetObject, data) {
      if (errGetObject) {
        if (debug) console.log('Error al leer  ' + $scope.key + ' o no tiene permisos.');
        if (debug) console.log(errGetObject);
        //window.location.replace("/home/index.html");
        // expiredToken();
      } else {
        var file = JSON.parse(data.Body.toString('utf-8'));
        for (var key in file) {
          file[key].slug = slugify(file[key].title);
        }
        $scope.contents = file.reverse();
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
        // ELIMINAMOS EL FICHERO HTML generado
        var title = slugify($scope.contents[id].title);
        var keyC = 'home/content/html/' + $scope.contents[id].type + '/' + title + '.html';
        var paramsDeleteObject = { Bucket: $scope.bucket, Key: keyC };
        s3.deleteObject(paramsDeleteObject, function(errDeletingFile, dataFileDeleted) {
          if (errDeletingFile) {
            if (debug) console.log('El fichero ' + keyC + ' NO existe en el bucket o no tiene permisos.');
            if (debug) console.log('Error guardando el fichero')
            if (debug) console.log(errDeletingFile);
            expiredToken();
          } else {
            if (debug) console.log('Fichero eliminado correctamente');
            if (debug) console.log(dataFileDeleted);
            
            // ELIMINAMOS LA INFO DEL contents.json
            $scope.contents.splice(id, 1);
            const file = JSON.stringify($scope.contents);
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
                $scope.$apply();
              }
            }); // /putObject('contents.json') 
          } // end-if success deleting html file
        }); // /deleteObject()
      } // /end-if id > -1
      else {
        console.log('No se ha encontrado el registro.');
      }
    } // /end-if confirmar
  };
});