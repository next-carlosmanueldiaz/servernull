/**
 * Librería de autenticación en AWS con Amazon Cognito
 */

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
    if (pair[0] === variable) {
      return pair[1];
    }
  }
  // if (debug) console.debug('Query Variable ' + variable + ' not found');
}

var salir = getQueryVariable('salir');
if (typeof salir !== 'undefined') {
  if (salir === "true") {
    signOut();
  }
}

// var app = angular.module('myApp', []);
// app.controller('myCtrl', function ($scope) {

//   this.$onInit = function () {
//     // ver en /assets/js/contents.js
//   }
// });

/** 
 * Obtiene credenciales para acceder al backend
*/
function getAccess() {
  // Miramos si hay id_token
  if (typeof sessionStorage.id_token !== "undefined" && sessionStorage.id_token !== "") {
    // Si hay id_token ya guardado en la sesión, hemos hecho login, y establecemos rol
    if (debug) console.log('A.- Establecemos el rol del Administrador (Autenticado).');
    userLoggedIn('accounts.google.com', sessionStorage.id_token);
    checkCurrentRoleIdentity();
  } else {
    // Acceso restringido sólo a administradores
    if (debug) console.log('Acceso restringido.');
    window.location.replace("/home/index.html");
  }
  return true;
}

// Hay 2 situaciones posibles:
// - NADA MAS ATERRIZAR EN CUALQUIER PÁGINA.. ejecutar setUnauth() SI queremos usar el API (s3 en la home)
//   Sin googleUser, es decir en ningún momento se ha logueado previamente.
//    Nada más empezar, se ejecuta la función setUnauth(), que da el rol Unauth
// - NADA MAS LOGUEARSE EN GOOGLE.. ejecutar onLogIn(googleUser)
// - NADA MÁS ATERRIZAR EN CUALQUIER PÁGINA.. CON UN id_token YA EXISTENTE: sessionStorage.id_token
// - CASO ESPECIAL: Cuando se abre de nuevo la página y ya tenemos ya el correo abierto.
//   Con googleUser:
//    En el momento en que un usuario se autentica con google o se ha logueado previamente
//    Almacenamos en la sesión el id_token.
//    Hacemos el cambio de rol o asumimos el nuevo rol.
//   Sin googleUser:
//    usamos el sessionStorage.id_token existente.
function getCurrentGoogleUser() {
  gapi.load('auth2', function() {
    var auth2 = gapi.auth2.getAuthInstance();
    if (auth2){
      console.log('Refreshing values...');
      // Recuperamos googleUser
      googleUser = auth2.currentUser.get();
      if (debug) console.log(JSON.stringify(googleUser, undefined, 2));
      if (debug) console.log(auth2.isSignedIn.get());
      onLogIn(googleUser);
    } else {
      if (debug) console.log('No existe auth2');
    }
  });
}

function onLogIn(googleUser) {
  if (!googleUser.error) {
    var profile = googleUser.getBasicProfile();
    if (debug) console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    if (debug) console.log('Name: ' + profile.getName());
    if (debug) console.log('Image URL: ' + profile.getImageUrl());
    if (debug) console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

    var id_token = googleUser.getAuthResponse().id_token;
    if (debug) console.log('id_token: ' + id_token); // Token para aws
    if (debug) console.log('You are now logged in. (Google account)');

    // PARA CAMBIAR A USUARIO AUTENTICADO
    // Almacenamos el id_token del usuario autenticado en la sesión para poder recuperarlo posteriormente 
    // y hacer el cambio de usuario no autenticado (invitado) a usuario autenticado.
    // https://docs.aws.amazon.com/es_es/cognito/latest/developerguide/switching-identities.html
    // Esta variable se evalúa en la función getCredentials() del fichero contents.js para saber:
    // - Si hay id_token: usuario logueado, que puede ser administrador
    // - Si no hay id_token: usuario invitado.
    // ====================================================================================
    sessionStorage.IdentityPoolId = IdentityPoolId;
    sessionStorage.id_token = id_token;
    // ====================================================================================
  } else {
    console.log(googleUser.error);
  }
}

// Obtiene datos del rol actual llamando a STS.getCallerIdentity() [AWS Security Token Service]
/*
  https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getCallerIdentity-property
  getCallerIdentity: Devuelve detalles sobre la identidad IAM cuyas credenciales se utilizan para llamar a la API.
  Función asíncrona (devuelve una promesa) que obtiene el ARN del ROL actual pidiéndoselo a AWS.
  Con esta función podemos saber qué rol actual tenemos. Opciones:
  - Ningún rol. No hay ningún usuario logueado.
  - Rol No autenticado: Cognito_ServerNull__Unauth_Role
  - Rol Autenticado: Cognito_ServerNull__Auth_Role        */
function checkCurrentRoleIdentity() {
  var sts = new AWS.STS();
  var params = {};
  sts.getCallerIdentity(params, function(err, data) {
    if (err) {
      if (debug) console.log('Ocurrió un error al consultar la identidad');
      if (debug) console.log(err, err.stack); // an error occurred
      var errMsg = err.originalError.originalError.message;

      if (errMsg.includes("Invalid login token. Token expired")) {
        if (debug) console.log(errMsg);
        // HA CADUCADO LA SESIÓN. SE ESTABLECE SESIÓN DE NUEVO, YA QUE TENEMOS TOKEN.
        // Miramos si hay id_token
        if (typeof sessionStorage.id_token !== "undefined" && sessionStorage.id_token !== "") {
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
      }


    } else {
      if (debug) console.log('========================================');
      if (debug) console.log('DATOS DE LA IDENTIDAD IAM (STS getCallerIdentity)');
      // if (debug) console.log(data);           // successful response
      if (debug) console.log('----------------------------------------');
      if (debug) console.log(' -> ROL ACTUAL: ' + data.Arn);
      if (debug) console.log('========================================');
    }
  });
}

// Obtiene el id_token del usuario logueado con google.
/*
  https://developers.google.com/identity/sign-in/web/backend-auth
  Dado un googleUser obtenido con el login con google, se obtiene el id_token con getAuthResponse()
  El id_token se le pasará a AWS para que asuma el rol adecuado a este usuario.
*/
function getGoogleUser(googleUser) {
  if (!googleUser.error) {
    var profile = googleUser.getBasicProfile();
    if (debug) console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    if (debug) console.log('Name: ' + profile.getName());
    if (debug) console.log('Image URL: ' + profile.getImageUrl());
    if (debug) console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

    // Google nos da el id_token del usuario logueado, si se ha logueado
    var id_token = googleUser.getAuthResponse().id_token;
    if (debug) console.log('You are logged in. (Google account). You have id_token:');
    if (debug) console.log('id_token: ' + id_token); // Token para aws
    return id_token;
  } else {
    return null;
  }
}

function setUnauth() {
  // Unauthenticated Identities
  // ===========================================================================
  // Obtenemos el rol de usuario no autenticado.
  // https://docs.aws.amazon.com/es_es/cognito/latest/developerguide/switching-identities.html
  // set the default config object
  if (debug) console.log('====================================================================');
  if (debug) console.log("ESTABLECIENDO EL ROL NO AUTENTICADO: Cognito_ServerNull__Unauth_Role");
  if (debug) console.log("IdentityPoolId para setUnauth: " + IdentityPoolId);
  var creds = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  });
  AWS.config.credentials = creds;
  if (debug) console.log("region para setUnauth: " + region);
  AWS.config.region = region;

  // Actualizamos y refrescamos
  creds.expired = true;
  AWS.config.update({ region: region, credentials: creds });
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
      // if (debug) console.log(AWS.config.credentials);
      if (debug) console.log(' -> RoleSessionName: ' + AWS.config.credentials.params.RoleSessionName);
      if (debug) console.log('====================================================================');
    }
  }); // Fin de refresco de credenciales
}

// Called when an identity provider has a token for a logged in user
// Params:
//  - providerName = 'accounts.google.com'
//  - token = id_token de googleUser
function userLoggedIn(providerName, token) {
    // https://docs.aws.amazon.com/es_es/cognito/latest/developerguide/switching-identities.html
    // set the default config object
    var creds = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IdentityPoolId
    });
    AWS.config.credentials = creds;
    AWS.config.region = region;

    creds.params.Logins = creds.params.Logins || {};
    creds.params.Logins[providerName] = token;

    // Expire credentials to refresh them on the next request
    creds.expired = true;

    if (debug) console.log('Successfully logged on amazon after UPDATE & REFRESH!');
    if (debug) console.log('Estas son las credenciales y refrescadas:');
    if (debug) console.log('TOMAMOS EL ROL DE ADMINISTRADOR:');
    if (debug) console.log('========================================');
    if (debug) console.log('Credenciales:');
    if (debug) console.log(AWS.config.credentials);
    if (debug) console.log('========================================');
    sessionStorage.rol = "admin";

    // TOKEN EXPIRED.. UPDATING TOKEN
    // Actualizamos las credenciales
    AWS.config.update({ region: sessionStorage.region, credentials: creds });
    AWS.config.credentials.refresh((errorRefreshCredentials) => {
      if (errorRefreshCredentials) {
        if (debug) console.log("error al refrescar las credenciales:");
        if (debug) console.log(errorRefreshCredentials);
        console.log('Su sesión ha caducado. Actualizar página para refrescar credenciales.');
        // window.location.replace("/home/index.html"); // Si ha caducado la sesión, avisamos y redirigimos a la home.
      } else {
        if (debug) console.log('Successfully logged on amazon after UPDATE & REFRESH!');
        if (debug) console.log('Estas son las credenciales y refrescadas:');
        if (debug) console.log('TOMAMOS POR DEFECTO EL ROL DEL INVITADO:');
        if (debug) console.log('========================================');
        if (debug) console.log('Credenciales:');
        if (debug) console.log(' -> RoleSessionName: ' + AWS.config.credentials.params.RoleSessionName);
        if (debug) console.log('====================================================================');
      }
    }); // Fin de refresco de credenciales
}

/**
 * Solicita contraseña al usuario del user pool
 * @param {type} googleUser
 * @returns {undefined}
 */
function register(googleUser) {
  if (!googleUser.error) {
    const profile = googleUser.getBasicProfile();
    const email = googleUser.getBasicProfile().getEmail();
    const username = email;
    if (debug) console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    if (debug) console.log('Name: ' + profile.getName());
    if (debug) console.log('Image URL: ' + profile.getImageUrl());
    if (debug) console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
    var id_token = googleUser.getAuthResponse().id_token;
    if (debug) console.log('id_token: ' + id_token); // Token para aws
    if (debug) console.log('You are now logged in. (Google)');
    AWS.config.region = region;
    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
    var poolData = {UserPoolId: userPoolId, ClientId: appClientId};
    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
    var userPoolData = {Username: username, Pool: userPool};
    const cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userPoolData);
    
    // El username inicial será siempre el email.
    var authenticationData = { Username: username, Password : passwordTemporal};
    var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
    if (debug) console.log('authenticationDetails:');
    if (debug) console.log(authenticationDetails);
    
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        const access_token = result.getAccessToken().getJwtToken();
        if (debug) console.log('access token: + ' + access_token);
        if (debug) console.log('idToken + ' + result.idToken.jwtToken);
        const paramGetUser = { AccessToken: access_token };
        cognitoidentityserviceprovider.getUser(paramGetUser, function (errGetUser, getUserData) {
          if (errGetUser) {
            if (debug) console.log('Error al buscar en el user pool Admins:');
            if (debug) console.log(errGetUser, errGetUser.stack); // an error occurred
          } else {
            if (debug) console.log('Usuario encontrado en el userpool Admins');
            if (debug) console.log(getUserData);           // successful response
            if (debug) console.log('USUARIO CONFIRMADO EN EL USER POOL DE ADMINS.');
            window.location.replace("/home/index.html");
          }
        });
      },
      onFailure: function (err) {
        if (debug) console.log('Error al autenticar al usuario. Mantenemos el usuario como invitado.');
        if (debug) console.log(err);
      },
      mfaRequired: function (codeDeliveryDetails) {
        var verificationCode = prompt('Please input verification code', '');
        cognitoUser.sendMFACode(verificationCode, this);
      },
      newPasswordRequired: function (userAttributes, requiredAttributes) {
        if (debug) console.log('userAttributes:');
        if (debug) console.log(userAttributes);
        if (debug) console.log('requiredAttributes:');
        if (debug) console.log(requiredAttributes);
        
        delete userAttributes.email_verified; // it's returned but not valid to submit
        let newPassword = prompt('Se requiere una nueva password!');
        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, this);
      }
    });
  }
}

/**
 * Salir
 * @returns {undefined}
 */
function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    // Borramos el id_token, que determina si está o no logueado.
    sessionStorage.id_token = "";
    sessionStorage.IdentityPoolId = "";
    // Una vez eliminado el id_token, iniciamos sesión como usuario no Autenticado.
    setUnauth();

    sessionStorage.accessKeyId = "";
    sessionStorage.secretAccessKey = "";
    sessionStorage.sessionToken = "";
    sessionStorage.expired = "";
    if (debug) console.log('User signed out.');
  });
}