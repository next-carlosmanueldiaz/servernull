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
  
  // window.location.replace("/home/index.html"); // No redireccionamos
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

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {
  
  this.$onInit = function () {
    $scope.googleSigninClientId = googleSigninClientId;

    // Miramos si hay id_token
    if (sessionStorage.id_token !== "") {
      // Si hay id_token ya guardado en la sesión, hemos hecho login, y establecemos rol
      if (debug) console.log('A.- Establecemos el rol del Administrador (Autenticado).');
      userLoggedIn('accounts.google.com', sessionStorage.id_token);
      // Quizá necesitemos asumir el rol de administrador.
      // -----------------------------------------------------
    } else {
      // Establecemos el rol no autenticado (rol por defecto)
      if (debug) console.log('B.- Establecemos el rol del invitado (No autenticado).');
      setUnauth();
    }

    checkCurrentRoleIdentity();

    sessionStorage.region = region;
    sessionStorage.bucket = bucket;

    $scope.bucket = bucket;
    $scope.key = 'home/content/json/contents.json';
    
    s3 = new AWS.S3();
    var fileParams = { Bucket: $scope.bucket, Key: $scope.key };
    s3.getObject(fileParams, function (errGetObject, data) {
      if (errGetObject) {
        if (debug) console.log('Error al leer  ' + $scope.key + ' o no tiene permisos.');
        if (debug) console.log(errGetObject);
        // expiredToken();
      } else {
        var file = JSON.parse(data.Body.toString('utf-8'));
        for (var key in file) {
          if (file[key].type == "article") {

            file[key].slug = slugify(file[key].title);
            if (debug) console.log(file[key].title);
            if (debug) console.log(file[key].slug);
            if (debug) console.log(file[key].type);
            if (debug) console.log(file[key].img);
            // ========================================================================
            // No necesitamos obtener los artículos, con el fichero contents.json tenemos suficiente.
            // Obtenemos el artículo para pintar el teaser
            // var keyJSON = 'home/content/json/' + file[key].type + '/' + file[key].slug + '.json';
            // ========================================================================
            // Obtenemos 
          }
        }

        $scope.contents = file;
        $scope.$apply();
      }
    });
  }

/*   $scope.eliminar = function (id) {
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
  }; */
});