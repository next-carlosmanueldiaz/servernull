/**
 * Editar la home (/index.html)
 * Usamos promesas para gestionar mejor las peticiones asíncronas y organizar mejor el código de las peticiones a AWS SDK
 * Una mejor organización de código puede ser la creación de una clase con las diferentes peticiones.
 * Gestión de promesas: https://docs.aws.amazon.com/es_es/sdk-for-javascript/v2/developer-guide/using-promises.html
 */

/**
 * Error: The provided token has expired.
 * @returns {undefined}
 */
function expiredToken() {
  console.log('User signed out.');
  // window.location.replace("/");
}

 /**
  * Obtenemos las entidades HTML del html guardado para poderlo mostrar en CKEditor.
  */
function toHtmlEntities(str) {
  var p = document.createElement("p");
  p.textContent = str;
  return p.innerHTML;
}

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {

  this.$onInit = function () {
    const permisos = getAccess(); // auth.js
    $scope.bucket = bucket; // config.js

    // ----------------------------------------------------------------------------------------------------
    // HOME: Leemos el fichero /index.html
    const keyHome = 'index.html';
    var fileParams = {Bucket: $scope.bucket, Key: keyHome};
    var reqGetIndex = new AWS.S3().getObject(fileParams, function (errGetObject, fileDataContentTypes) {});
    var promiseGetIndex = reqGetIndex.promise(); // create the promise object

    // Manejamos los estados completado/rechazado de la promesa
    promiseGetIndex.then(
      function(fileData) {
        var content = fileData.Body.toString('utf-8');
        $scope.htmlCode = toHtmlEntities(content);
        $scope.$apply();

        // CKEDITOR (lo cargamos después de meter el contenido en el textarea)
        CKEDITOR.replace('editor1', {
          fullPage: true,
          extraPlugins: 'docprops',
          // Disable content filtering because if you use full page mode, you probably
          // want to  freely enter any HTML content in source mode without any limitations.
          allowedContent: true,
          height: 320
        });
      },
      function(errGetObject) {
        if (debug) console.log('El fichero ' + keyHome + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        expiredToken();
      }
    );
  }



});