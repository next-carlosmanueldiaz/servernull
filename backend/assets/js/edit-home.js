/**
 * Editar la home (/index.html)
 * Usamos promesas para gestionar mejor las peticiones asíncronas y organizar mejor el código de las peticiones a AWS SDK
 * Una mejor organización de código puede ser la creación de una clase con las diferentes peticiones.
 * Gestión de promesas: https://docs.aws.amazon.com/es_es/sdk-for-javascript/v2/developer-guide/using-promises.html
 */

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
        $scope.htmlCode = content;
        $scope.$apply();

        // CKEDITOR (lo cargamos después de meter el contenido en el textarea)
        // ----------------------------------------------------------------------------------------------------
        var editor1 = CKEDITOR.replace('htmlCode', {
          extraAllowedContent: 'div',
          height: 460
        });
        editor1.on('instanceReady', function() {
          // Output self-closing tags the HTML4 way, like <br>.
          this.dataProcessor.writer.selfClosingEnd = '>';
    
          // Use line breaks for block elements, tables, and lists.
          var dtd = CKEDITOR.dtd;
          for (var e in CKEDITOR.tools.extend({}, dtd.$nonBodyContent, dtd.$block, dtd.$listItem, dtd.$tableContent)) {
            this.dataProcessor.writer.setRules(e, {
              indent: true,
              breakBeforeOpen: true,
              breakAfterOpen: true,
              breakBeforeClose: true,
              breakAfterClose: true
            });
          }
          // Start in source mode.
          this.setMode('source');
        });
        // ----------------------------------------------------------------------------------------------------
      },
      function(errGetObject) {
        if (debug) console.log('El fichero ' + fileParams.key + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        expiredToken();
      }
    );
  }



});