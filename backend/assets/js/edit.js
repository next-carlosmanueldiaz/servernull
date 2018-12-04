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
  // window.location.replace("/index.html");
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
    if (pair[0] === variable) {
      return pair[1];
    }
  } 
  alert('Query Variable ' + variable + ' not found');
}

// const debug = true;
// const tengoAcceso = getCredentials();
const id = getQueryVariable("id");

if (id) {
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
          // window.location.replace("/index.html");
          // expiredToken();
        } else {
          var file = JSON.parse(fileData.Body.toString('utf-8'));
          $scope.cts = file;
          for (var key in file) {
            if (file[key].id === id) {
              // console.log('encontrado en la posicion: ' + key);
              $scope.pos = key;
            }
          }
          $scope.$apply();
        }
      });
    }
    
    $scope.agregarCampo = function() {
      $scope.cts[$scope.pos].fields.push({ "id": "", "name": "", "type": "", "value": "" });
    }
    
    $scope.eliminarCampo = function (id) {
      var confirmar = confirm('¿Estás seguro?');
      if (confirmar) {
        $scope.cts[$scope.pos].fields.splice(id, 1);
        if (debug) console.log('Campo ' + id + ' eliminado correctamente');            
      }
    };
    
    /**
     * Leemos todos los campos y generamos la plantilla por defecto.
     * @returns {txt}
     */
    $scope.loadDefaultTpl = function () {
      var debug = false;
      if (debug) console.log('pos: ' + $scope.pos);
      if (debug) console.log($scope.cts[$scope.pos].fields);
      var confirmar = confirm('¿Estás seguro?');
      if (confirmar) {
        var html = '<div class="row '+ $scope.cts[$scope.pos].id+'">\n\
 <div class="col">\n\
';
        for (var i in $scope.cts[$scope.pos].fields) {
          if (debug) console.log(field);
          var field = $scope.cts[$scope.pos].fields[i];
          switch (field.type) {
            case 'title':
              html += '   <div class="row"><div class="col"><h1 class="title '+ field.id +'">{{content.'+ field.id +'}}</h1></div></div>\n\
';
              break;
            case 'text':
              html += '   <div class="row"><div class="col"><p class="text '+ field.id +'">{{content.'+ field.id +'}}</p></div></div>\n\
';
              break;
            case 'textarea':
              html += '   <div class="row"><div class="col"><p class="textarea '+ field.id +'">{{content.'+ field.id +'}}</p></div></div>\n\
';
              break;
            case 'number':
              html += '   <div class="row"><div class="col"><p class="number '+ field.id +'">{{content.'+ field.id +'}}</p></div></div>\n\
';
              break;
            case 'image':
              html += '   <div class="row"><div class="col"><img class="image '+ field.id +'" src="{{content.'+ field.id +'}}"/></div></div>\n\
';
              break;
          }
        }
        html += '  </div>\n\
 </div>';
        $scope.cts[$scope.pos].tpl = html;
      }
    };
    
    /**
     * Formatear código html con html_beautify
     * @returns {undefined}
     */
    $scope.formatCode = function () {
      var opts = {
        indent_size: 4,
        indent_char: ' ',
        preserve_newlines: true,
        jslint_happy: false,
        keep_array_indentation: false,
        brace_style: 'collapse',
        space_before_conditional: true,
        break_chained_methods: false,
        selector_separator: '\n',
        end_with_newline: false
      };

      html_beautify($scope.cts[$scope.pos].tpl, opts);
    }
    
    // SUBMIT FORMULARIO: guardamos los datos del tipo de contenido
    $scope.submit = function () {
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
          if (debug) console.log('Fichero guardado correctamente en ' + $scope.key);
          if (debug) console.log(dataPutObject);
        }
      });
    };
  });
}