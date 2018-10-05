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
  console.debug('Query Variable ' + variable + ' not found');
}

var salir = getQueryVariable('salir');
if (salir === "true") {
  signOut();
}

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {

  this.$onInit = function () {
    $scope.googleSigninClientId = googleSigninClientId;
    // $scope.$apply();
  }
});

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
    sessionStorage.id_token = id_token;
    // userLoggedIn("accounts.google.com", sessionStorage.id_token);
    // ====================================================================================
    sessionStorage.IdentityPoolId = IdentityPoolId;
    sessionStorage.roleArnAccesoAdmin = roleArnAccesoAdmin;
    sessionStorage.roleSessionAdminName = roleSessionAdminName;

    AWS.config.region = sessionStorage.region;
    var cognitoidentity = new AWS.CognitoIdentity();
    var paramsToGetID = { "IdentityPoolId": IdentityPoolId };
    cognitoidentity.getId(paramsToGetID, function (err, dataID) {
      if (err) {
        if (debug) console.log('Ha ocurrido un error al obtener el ID de Cognito.');
        if (debug) console.log(err, err.stack); // an error occurred
      } else {
        if (debug) console.log('Se ha obtenido el ID de Cognito correctamente ( cognitoidentity.getId() ).');
        if (debug) console.log(dataID);
        var paramsToGetCredentials = { IdentityId: dataID.IdentityId };
        if (debug) console.log('Retrieve TEMP credentials with IdentityId (cognitoidentity.getCredentialsForIdentity() ):');
        cognitoidentity.getCredentialsForIdentity(paramsToGetCredentials, function (err, dataCredentialsForIdentity) {
          if (err) {
            if (debug) console.log('Error en getCredentialsForIdentity:');
            if (debug) console.log(err, err.stack);
          } else {
            if (debug) console.log('Successful response from Cognito Identity (dataCredentialsForIdentity)!. Con esto ya tenemos AccessKeyId, SecretKey y SessionTokey:');
            if (debug) console.log(dataCredentialsForIdentity);
            if (debug) console.log('Actualizamos las credenciales, para evitar el error: Missing credentials');
            var creds = new AWS.Credentials({
              accessKeyId: dataCredentialsForIdentity.Credentials.AccessKeyId,
              secretAccessKey: dataCredentialsForIdentity.Credentials.SecretKey,
              sessionToken: dataCredentialsForIdentity.Credentials.SessionToken,
              expireTime: dataCredentialsForIdentity.Credentials.Expiration,
              expired: false
            });
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
                if (debug) console.log('Credenciales:');
                if (debug) console.log(AWS.config.credentials);
              }
            });
            var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
            var listUsersParams = {
              UserPoolId: userPoolId,
              AttributesToGet: [ 'email'],
              Filter: 'email = "' + profile.getEmail() + '"',
              Limit: 1
            };
            if (debug) console.log(listUsersParams);
            cognitoidentityserviceprovider.listUsers(listUsersParams, function (errListusers, listaUsuarios) {
              if (errListusers) {
                if (debug) console.log('Error al buscar en el user pool Admins:');
                if (debug) console.log(errListusers, errListusers.stack); // an error occurred
              } else {
                if (listaUsuarios.Users[0]) {
                  if (listaUsuarios.Users[0].Attributes[0].Value == profile.getEmail() && listaUsuarios.Users[0].Enabled == true) {
                    if (debug) console.log('Usuario encontrado en el userpool Admins');
                    if (debug) console.log(listaUsuarios);           // successful response
                    if (debug) console.log('Ahora podemos hacer la llamada a AssumeRoleWithWebIdentity para hacerlo Admin');
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
                          // window.location.replace("/backend/index.html"); // Redirect anulado al backend.. mostramos home con login hecho
                        } else {
                          if (debug) console.log('Sorry! No Web Storage support..');
                        }

                        if (debug) console.log('Y POR FIN! YA PODEMOS ACCEDER A LOS FICHEROS PERMITIDOS SÓLO PARA ADMINISTRADOR!:');
                      } // Fin assumeRole correcto
                     }); // Fin llamada assumeRoleWithWebIdentity
                  } else {
                    debug = true;
                    if (debug) console.log('Usuario desconocido. Se le mantiene como INVITADO a la página sin permisos.');
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
                  if (debug) console.log('Usuario desconocido. Se le mantiene como INVITADO a la página sin permisos.');
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
              } // Fin retorno de ListUsers() sin error
            }); // Fin ListUsers();
          } // Fin de Obtener credenciales con getCredentialsForIdentity() correcto
        }); // cognitoidentity.getCredentialsForIdentity
      } // Si ID Cognito obtenido correctamente
    }); // cognitoidentity.getId()
  } else {
    if (debug) console.log('There was a problem logging you in. No id_token');
  }
}

// Called when an identity provider has a token for a logged in user
function userLoggedIn(providerName, token) {
    // https://docs.aws.amazon.com/es_es/cognito/latest/developerguide/switching-identities.html
    // set the default config object
    var creds = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: sessionStorage.IdentityPoolId
    });
    AWS.config.credentials = creds;
    AWS.config.region = sessionStorage.region;

    creds.params.Logins = creds.params.Logins || {};
    creds.params.Logins[providerName] = token;

    // Expire credentials to refresh them on the next request
    creds.expired = true;

    if (debug) console.log('Successfully logged on amazon after UPDATE & REFRESH!');
    if (debug) console.log('Estas son las credenciales y refrescadas:');
    if (debug) console.log('Region: ' + AWS.config.region);
    if (debug) console.log('TOMAMOS EL ROL DE ADMINISTRADOR:');
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
    sessionStorage.rol = "admin"
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
    sessionStorage.accessKeyId = "";
    sessionStorage.secretAccessKey = "";
    sessionStorage.sessionToken = "";
    sessionStorage.expired = "";
    if (debug) console.log('User signed out.');
  });
}