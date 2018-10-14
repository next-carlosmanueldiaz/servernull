/**
 * Comprueba y recupera las credenciales de la sesión
 * @returns {Boolean}
 */
function getCredentials() {
  // var debug = false;


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
      if (debug) console.log('========================================');
      if (debug) console.log('Credenciales:');
      if (debug) console.log(AWS.config.credentials);
      
      // if (debug) console.log('RoleSessionName: ' + AWS.config.credentials.params.RoleSessionName);

      // SI YA TENEMOS CREDENCIALES, NO NECESITAMOS VOLVER A HACER LOGIN
      // Devuelve detalles sobre la identidad IAM cuyas credenciales se utilizan para llamar a la API.
      var sts = new AWS.STS();
      var params = {};
      sts.getCallerIdentity(params, function(err, data) {
        if (err) {
          if (debug) console.log('Ocurrió un error al consultar la identidad');
          if (debug) console.log(err, err.stack); // an error occurred
        } else {
          if (debug) console.log('DATOS DE LA IDENTIDAD IAM (STS getCallerIdentity)');
          if (debug) console.log(data);           // successful response
        }
      });
      if (debug) console.log('Acceso condecido como administrador.');
      return true;
    } 
    // PERMISOS: ¿QUÉ SE PUEDE VER Y QUÉ SE PUEDE MODIFICAR?
    // - USUARIO ANÓNIMO (SIN AUTENTICAR): puede leer todo.
    // - USUARIO AUTENTICADO: puede escribir en algunos archivos
    
    // Para poder hacer peticiones a S3 y leer un archivo a través del API, debemos tener algún tipo de credenciales
    // Aunque el archivo sea público, es necesario tener credenciales para poder hacer peticiones al API de S3.

    else {
      // Unauthenticated Identities
      // ===========================================================================
      // Obtenemos el rol de usuario no autenticado.
      // https://docs.aws.amazon.com/es_es/cognito/latest/developerguide/switching-identities.html
      // set the default config object
      var creds = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: IdentityPoolId
      });
      AWS.config.credentials = creds;
      AWS.config.region = sessionStorage.region;

      // Actualizamos y refrescamos
      creds.expired = true;
      AWS.config.update({ region: sessionStorage.region, credentials: creds });
      AWS.config.credentials.refresh((errorRefreshCredentials) => {
        if (errorRefreshCredentials) {
          if (debug) console.log("error al refrescar las credenciales:");
          if (debug) console.log(errorRefreshCredentials);
        } else {
          if (debug) console.log('Successfully logged on amazon after UPDATE & REFRESH!');
          if (debug) console.log('Estas son las credenciales y refrescadas:');
          if (debug) console.log('TOMAMOS POR DEFECTO EL ROL DEL INVITADO:');
          if (debug) console.log('========================================');
          if (debug) console.log('Credenciales:');
          if (debug) console.log('----------------------------------------');
          // if (debug) console.log(AWS.config.credentials);
          if (debug) console.log(' -> RoleSessionName: ' + AWS.config.credentials.params.RoleSessionName);
          if (debug) console.log('========================================');

          sessionStorage.rol = "invitado"
          // if (debug) console.log(sessionStorage);

          // Devuelve detalles sobre la identidad IAM cuyas credenciales se utilizan para llamar a la API.
          var sts = new AWS.STS();
          var params = {};
          sts.getCallerIdentity(params, function(err, data) {
            if (err) {
              if (debug) console.log('Ocurrió un error al consultar la identidad');
              if (debug) console.log(err, err.stack); // an error occurred
            } else {
              if (debug) console.log('========================================');
              if (debug) console.log('DATOS DE LA IDENTIDAD IAM (STS getCallerIdentity)');
              // if (debug) console.log(data);           // successful response
              if (debug) console.log('----------------------------------------');
              if (debug) console.log(' -> ROL ACTUAL: ' + data.Arn);
              if (debug) console.log('========================================');
            }
          });

          return true;
        }
      });
    }
  } else {
    if (debug) console.log('No sessionStorage allowed.');
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
  
  // window.location.replace("/home/index.html"); // No redireccionamos
}

/**
 * Finaliza la sesión de google
 * @returns {undefined}
 */
function signOut(e) {
  // e.preventDefault();
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
    sessionStorage.accessKeyId = "";
    sessionStorage.secretAccessKey = "";
    sessionStorage.sessionToken = "";
    sessionStorage.expired = "";

    var data = {
        UserPoolId : userPoolId, // Your user pool id here
        ClientId : appClientId // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
    var cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
      cognitoUser.signOut();
    } else {
      if (debug) console.log('userPool.getCurrentUser() retorna NULL.');
    }
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

// const tengoAcceso = whoAreYou();

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

            // file[key].slug = slugify(file[key].title);
            if (debug) console.log(file[key].slug);
            // ========================================================================
            // Obtenemos el artículo para pintar el teaser
            var keyJSON = 'home/content/json/' + file[key].type + '/' + file[key].slug + '.json';
            // ========================================================================
            // Obtenemos 
          }
        }
        $scope.contents = file;
        $scope.$apply();
      }
    });
  }

  $scope.eliminar = function (id) {
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