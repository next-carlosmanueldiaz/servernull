/**
 * Comprueba y recupera las credenciales de la sesión
 * @returns {Boolean}
 */
function getCredentials() {
  // var debug = false;
  if (typeof (Storage) !== "undefined") {
    if (sessionStorage.id_token && sessionStorage.id_token !== "") {
      userLoggedIn("accounts.google.com", sessionStorage.id_token);
      return true;
    } else {
      // Unauthenticated Identities
      // ===========================================================================
      // Obtenemos el rol de usuario no autenticado.
      sessionStorage.region = 'eu-west-1';
      sessionStorage.bucket = bucket;

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
          if (debug) console.log('Region: ' + AWS.config.region);
          if (debug) console.log('TOMAMOS POR DEFECTO EL ROL DEL INVITADO:');
          if (debug) console.log('========================================');
          if (debug) console.log('Credenciales:');
          if (debug) console.log(AWS.config.credentials);
          if (debug) console.log('========================================');
          if (debug) console.log('Almacenamos en sesión:');
          sessionStorage.accessKeyId = AWS.config.credentials.accessKeyId; 
          sessionStorage.secretAccessKey = AWS.config.credentials.secretAccessKey;
          sessionStorage.sessionToken = AWS.config.credentials.sessionToken;
          sessionStorage.expireTime = AWS.config.credentials.expireTime;
          sessionStorage.expired = false
          sessionStorage.counter = 2;
          sessionStorage.rol = "invitado"
          return true;
        }
      });

    }
  } else {
    // El navegador no soporta almacenar en Session Storage
    if (debug) console.log('Sorry! No Web browser Session Storage support..');
  }
}

// Called when an identity provider has a token for a logged in user
function userLoggedIn(providerName, token) {
    // https://docs.aws.amazon.com/es_es/cognito/latest/developerguide/switching-identities.html
    // set the default config object
    // var creds = new AWS.CognitoIdentityCredentials({
    //     IdentityPoolId: sessionStorage.IdentityPoolId
    // });
    // AWS.config.credentials = creds;
    // AWS.config.region = sessionStorage.region;

    // creds.params.Logins = creds.params.Logins || {};
    // creds.params.Logins[providerName] = token;

    // // Expire credentials to refresh them on the next request
    // creds.expired = true;

    // if (debug) console.log('Successfully logged on amazon after UPDATE & REFRESH!');
    // if (debug) console.log('Estas son las credenciales y refrescadas:');
    // if (debug) console.log('Region: ' + AWS.config.region);
    // if (debug) console.log('TOMAMOS EL ROL DE ADMINISTRADOR:');
    // if (debug) console.log('========================================');
    // if (debug) console.log('Credenciales:');
    // if (debug) console.log(AWS.config.credentials);
    // if (debug) console.log('========================================');
    // if (debug) console.log('Almacenamos en sesión:');
    // sessionStorage.accessKeyId = AWS.config.credentials.accessKeyId; 
    // sessionStorage.secretAccessKey = AWS.config.credentials.secretAccessKey;
    // sessionStorage.sessionToken = AWS.config.credentials.sessionToken;
    // sessionStorage.expireTime = AWS.config.credentials.expireTime;
    // sessionStorage.expired = false
    // sessionStorage.counter = 2;
    // sessionStorage.rol = "admin"

    // ASIGNAMOS ROL DE ADMINISTRADOR.
    var sts = new AWS.STS();
    var paramsAssumeRole = {
      RoleArn: roleArnAccesoAdmin,
      RoleSessionName: roleSessionAdminName,
      WebIdentityToken: id_token,
      DurationSeconds: 3600,
    };
    if (debug) console.log(paramsAssumeRole);
    sts.assumeRoleWithWebIdentity(paramsAssumeRole, function (errAssumeRole, rolAsumido) {
      if (errAssumeRole) {
        if (debug) console.log('Error al asumir el rol de administrador');
        if (debug) console.log(errAssumeRole, errAssumeRole.stack); // an error occurred
      } else {
        if (debug) console.log('ASUMIMOS EL NUEVO ROL DEL ADMINISTRADOR:');
        if (debug) console.log('========================================');
        if (debug) console.log(rolAsumido);
        if (debug) console.log('VOLVEMOS A ACTUALIZAR LAS CREDENCIALES');
        var credsData = {
          accessKeyId: rolAsumido.Credentials.AccessKeyId,
          secretAccessKey: rolAsumido.Credentials.SecretAccessKey,
          sessionToken: rolAsumido.Credentials.SessionToken,
          expireTime: rolAsumido.Credentials.Expiration,
          expired: false
        };
        var creds = new AWS.Credentials(credsData);
        if (debug) console.log(creds);
        creds.expired = true;
        AWS.config.update({ region: sessionStorage.region, credentials: creds });
        AWS.config.credentials.refresh((errorRefreshCreds) => {
          if (errorRefreshCreds) {
            if (debug) console.error(errorRefreshCreds);
          } else {
            if (debug) console.log('Nuevas credenciales del Administrador refrescadas:');
            if (debug) console.log('Region: ' + AWS.config.region);
            if (debug) console.log('Credenciales:');
            if (debug) console.log(AWS.config.credentials);
          }
        });
        if (typeof (Storage) !== "undefined") {
          sessionStorage.region = region;
          sessionStorage.bucket = bucket;
          sessionStorage.accessKeyId = rolAsumido.Credentials.AccessKeyId;
          sessionStorage.secretAccessKey = rolAsumido.Credentials.SecretAccessKey;
          sessionStorage.sessionToken = rolAsumido.Credentials.SessionToken;
          sessionStorage.expireTime = rolAsumido.Credentials.Expiration;
          sessionStorage.expired = false
          sessionStorage.counter = 2;
          sessionStorage.rol = "admin"
          // window.location.replace("/backend/index.html"); // Redirect anulado al backend.. mostramos home con login hecho
        } else {
          if (debug) console.log('Sorry! No Web Storage support..');
        }

        if (debug) console.log('Y POR FIN! YA PODEMOS ACCEDER A LOS FICHEROS PERMITIDOS SÓLO PARA ADMINISTRADOR!:');
      } // Fin assumeRole correcto
   }); // Fin llamada assumeRoleWithWebIdentity
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

// En la home pedimos credenciales, es de lectura pública, obtenemos credenciales públicas
const tengoAcceso = getCredentials();

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {
  
  this.$onInit = function () {
    $scope.googleSigninClientId = googleSigninClientId;

    $scope.bucket = sessionStorage.bucket;
    $scope.region = sessionStorage.region;
    $scope.key = 'home/content/json/contents.json';
    
    s3 = new AWS.S3();
    var fileParams = { Bucket: $scope.bucket, Key: $scope.key };
    s3.getObject(fileParams, function (errGetObject, data) {
      if (errGetObject) {
        if (debug) console.log('Error al leer  ' + $scope.key + ' o no tiene permisos.');
        if (debug) console.log(errGetObject);
        expiredToken();
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