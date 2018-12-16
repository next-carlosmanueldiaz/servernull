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
  // window.location.replace("/index.html");
}

/**
 * Obtiene el slug de un texto dado por parámetro
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

/**
 * Obtiene valores aleatorios entre min y max
 * @param {int} min 
 * @param {int} max 
 */
function getRandomArbitrary(min, max) {
  return Math.ceil(Math.random() * (max - min) + min);
}

var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope) {
  
  this.$onInit = function () {
    const permisos = getAccess();
    $scope.bucket = bucket;
    // Leemos content-types.json para obtener los campos del tipo de contenido
    const keyCT = 'private/content-types/json/content-types.json';
    var fileParams = {Bucket: $scope.bucket, Key: keyCT};
    s3 = new AWS.S3();
    s3.getObject(fileParams, function (errGetObject, fileDataContentTypes) {
      if (errGetObject) {
        if (debug) console.log('El fichero ' + key + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        expiredToken();
      } else {
        const id = getQueryVariable("id");
        var contentTypes = JSON.parse(fileDataContentTypes.Body.toString('utf-8'));
        $scope.cts = contentTypes;
        for (var key in contentTypes) {
          if (contentTypes[key].id === id) {
            $scope.pos = key;
          }
        }
        $scope.$apply();
      }
    });
  }
  
  function addPhoto(file) {

    var files = document.getElementById('photoupload').files;
    if (!files.length) {
      return alert('Please choose a file to upload first.');
    }
    var file = files[0];
    var fileName = file.name;
    var albumPhotosKey = encodeURIComponent(albumName) + '//';
  
    var photoKey = albumPhotosKey + fileName;
    s3.upload({
      Key: photoKey,
      Body: file,
      ACL: 'public-read'
    }, function(err, data) {
      if (err) {
        return alert('There was an error uploading your photo: ', err.message);
      }
      alert('Successfully uploaded photo.');
      viewAlbum(albumName);
    });
  }
  
  /**
   * SUBMIT FORMULARIO: 
   *  - Creamos el fichero HTML DEL POST mezclando la base (html.html), template y datos:  slug-title.html
   *  - guardamos los datos del contenido en el nuevo json:                       slug-tittle.json
   *  - Actualizamos el JSON con el listado de contenidos: home/content/json/contents.json
   *  - ACTUALIZAMOS EL index.html DE LA PÁGINA PRINCIPAL con el nuevo artículo
   * 
   * @returns {undefined}
   */
  $scope.submit = function () {
    const permisos = getAccess();
    var titulo = $scope.cts[$scope.pos].fields[0].value;
    var title = slugify(titulo);
    
    // Lo primero que vamos a hacer es guardar las imagenes que hay
    for (var key in $scope.cts[$scope.pos].fields) {
      if ($scope.cts[$scope.pos].fields[key].name == 'Image') {
        if (debug) console.log($scope.cts[$scope.pos].fields[key].name);
      }
    }

    // HTML (POST)
    // ========================================================================
    // Obtenemos el HTML GENÉRICO DEL POST
    const keyHtml = 'backend/html.html';
    // ========================================================================
    var fileParams = {Bucket: $scope.bucket, Key: keyHtml};
    s3 = new AWS.S3();
    // Cargamos la plantilla html.html
    s3.getObject(fileParams, function (errGetObject, fileData) {
      if (errGetObject) {
        if (debug) console.log('El fichero ' + key + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log(errGetObject);
        expiredToken();
      } else {
        // Rellenamos el contenido del HTML con los datos
        var html = fileData.Body.toString('utf-8');
        html = html.replace("{{title}}", $scope.cts[$scope.pos].fields[0].value);
        html = html.replace("{{script}}", "\r\n" + $scope.cts[$scope.pos].js);
        html = html.replace("{{css}}", $scope.cts[$scope.pos].css);
        
        // SISTEMA DE COMENTARIOS DISQUS: https://disqus.com/ universalcode
        // El código de disqus se incluye en la plantilla (TPL) del tipo de contenido (artículo)
        html = html.replace("{{PAGE_URL}}", domainURL + 'home/content/html/' + $scope.cts[$scope.pos].id + '/' + title + '.html');
        html = html.replace("{{PAGE_IDENTIFIER}}", title);
        html = html.replace("{{DISQUSID}}", domain); // TPL
        
        var tpl = $scope.cts[$scope.pos].tpl;
        for (var key in $scope.cts[$scope.pos].fields) {
          var mascara = "{{content." + $scope.cts[$scope.pos].fields[key].id + "}}";
          tpl = tpl.replace(mascara, $scope.cts[$scope.pos].fields[key].value);
        }
        html = html.replace("{{content}}", tpl);
        
        // Guardamos el fichero HTML del POST
        var keyHTML = 'home/content/html/' + $scope.cts[$scope.pos].id + '/' + title + '.html';
        var paramsHtmlObject = { Bucket: $scope.bucket, Key: keyHTML, Body: html, ContentType: "text/html"};
        s3.putObject(paramsHtmlObject, function (errSavingFile, dataPutObject) {
          if (errSavingFile) {
            if (debug) console.log('El fichero ' + key + ' NO existe en el bucket o no tiene permisos.');
            if (debug) console.log('Error guardando el fichero')
            if (debug) console.log(errSavingFile);
            expiredToken();
          } else {
            if (debug) console.log('Fichero guardado correctamente en ' + keyHTML);
            // if (debug) console.log(dataPutObject);
          }
        }); // / putObject('title.html)
      }
    });
       
    // ========================================================================
    // Generamos el JSON con los datos del contenido
    // ========================================================================
    var keyC = 'home/content/json/' + $scope.cts[$scope.pos].id + '/' + title + '.json';
    // ========================================================================
    var img = "";
    var contenido = "[";
    // Recogemos los valores del formulario
    for (var key in $scope.cts[$scope.pos].fields) {
      var idCampo     = $scope.cts[$scope.pos].fields[key].id;
      var nameCampo   = $scope.cts[$scope.pos].fields[key].name;
      var typeCampo   = $scope.cts[$scope.pos].fields[key].type;
      var valueCampo  = $scope.cts[$scope.pos].fields[key].value;
      
      valueCampo = valueCampo.replace(/(\r?\n|\r|\n)/gm, '<br/>');
      
      var campo = '{ "id" : "' + idCampo + '", "name" : "' + nameCampo + '", "type" : "' + typeCampo + '", "value" : "' + valueCampo + '" },';
      
      if (img == "") {
        if (idCampo == "img") {
          img = valueCampo;
        }
      }

      contenido += campo;
    }
    contenido = contenido.slice(0, -1);
    contenido += "]";
    
    // Guardamos los datos del nuevo contenido en el fichero JSON
    // ========================================================================
    var paramsObject = { Bucket: $scope.bucket, Key: keyC, Body: contenido };
    s3.putObject(paramsObject, function (errSavingFile, dataPutObject) {
      if (errSavingFile) {
        if (debug) console.log('El fichero ' + key + ' NO existe en el bucket o no tiene permisos.');
        if (debug) console.log('Error guardando el fichero')
        if (debug) console.log(errSavingFile);
        expiredToken();
      } else {
        if (debug) console.log('%c JSON ', 'background: #222; color: #bada55', 'guardado correctamente en ' + keyC);
        // if (debug) console.log(dataPutObject);
        // ========================================================================
        // ACTUALIZAMOS (OBTENEMOS, AGREGAMOS Y GUARDAMOS) EL JSON CON EL LISTADO DE CONTENIDOS
        const keyCL = 'home/content/json/contents.json';
        // ========================================================================
        var fileParams = {Bucket: $scope.bucket, Key: keyCL};
        s3.getObject(fileParams, function (errGetObject, fileDataContents) {
          if (errGetObject) {
            if (debug) console.log('El fichero ' + key + ' NO existe en el bucket o no tiene permisos.');
            if (debug) console.log(errGetObject);
            expiredToken();
          } else {
            // OBTENEMOS contents.json
            var contents = JSON.parse(fileDataContents.Body.toString('utf-8'));
            const type = getQueryVariable("id");
            var date = new Date(); // No necesito guardar la fecha porque puedo darle la vuelta al mostrar el fichero en la home con .reverse()
            var content = {"title" : titulo, "type": type, "img": img, "date": date};
            // AGREGAMOS el nuevo contenido a contents.json, al final del fichero
            contents.push(content);
            var fileContents = JSON.stringify(contents);
            // GUARDAMOS el nuevo contents.json
            var paramsContentsObject = { Bucket: $scope.bucket, Key: keyCL, Body: fileContents };
            s3.putObject(paramsContentsObject, function (errSavingFile, dataPutObject) {
              if (errSavingFile) {
                if (debug) console.log('El fichero ' + key + ' NO existe en el bucket o no tiene permisos.');
                if (debug) console.log('Error guardando el fichero')
                if (debug) console.log(errSavingFile);
                expiredToken();
              } else {
                if (debug) console.log('%c JSON ', 'background: #222; color: #bada55', 'guardado correctamente en ' + keyCL);
                //---------------------------------------------------------------------------------
                // MODIFICAMOS LA HOME
                // Cada vez que se modifica el contenido de un artículo, la home cambia.
                // No vamos a usar angular para la home, ya que es una mala solución, usaremos HTML

                // Cargamos el fichero index.html (home) <--- en la raiz del bucket
                var keyHome = 'index.html';
                s3 = new AWS.S3();
                var fileParams = { Bucket: $scope.bucket, Key: keyHome };
                s3.getObject(fileParams, function (errGetObject, data) {
                  if (errGetObject) {
                    if (debug) console.log('Error al leer  ' + keyContents + ' o no tiene permisos.');
                    if (debug) console.log(errGetObject);
                    // expiredToken();
                  } else {
                    //=========================================================================================
                    // OBTENEMOS EL HTML DE index.html en forma de texto
                    //=========================================================================================
                    var fileHTML = data.Body.toString('utf-8');
                    // CONVERTIRMOS EL TEXTO A DOM
                    doc = new DOMParser().parseFromString(fileHTML, "text/html");
                    //=========================================================================================
                    // contents.json
                    // Eliminamos los elementos que no son artículos del fichero contents.json
                    for (var key in contents) {
                      if (contents[key].type != "article") {
                        // Elimina el elemento del array que no es un artículo
                        contents.splice(key, 1);
                      }
                    }
                    var last = contents.length - 1; // Empieza en cero.
                    //-----------------------------------------------------------------------------------------
                    // Obtenemos el slug y sacamos el titular del último elemento
                    for (var key in contents) {
                      contents[key].slug = slugify(contents[key].title);
                      if (key == last) {
                        var titular = contents[key];
                        contents.splice(key, 1);
                      }
                    }
                    // Tomamos sólo los artículos para la portada, dándoles la vuelta al array con .reverse()
                    contents = contents.reverse();
                    //=========================================================================================
                    // Aplicamos el json directamente sobre /index.html

                    // TITULAR HOME
                    doc.getElementById('titular').setAttribute('data-src', titular.img);
                    // /home/content/html/{{titular.type}}/{{titular.slug}}.html
                    var titularLink = "/home/content/html/" + titular.type + "/" + titular.slug + ".html";
                    doc.getElementById('titular-link').setAttribute('href', titularLink);
                    doc.getElementById('titular-title').innerHTML = titular.title;

                    // Primero nos cargamos todos los previamente generados
                    var generated = doc.getElementById("container-inside").querySelectorAll(".generated");
                    if (generated.length > 0) {
                      for (var i=0; i < generated.length;i++) {
                        doc.getElementById("container-inside").removeChild(generated[i]);
                      }
                    }

                    // Cálculo aleatorio de las columnas de cada fila de los teasers de la home
                    // Cada vez que se crea o actualiza un articulo se vuelven a obtener aleatoriamente.
                    var items = [[3, 6, 3],[3, 9],[4, 8],[5, 7],[6, 6],[8, 4],[9, 3],[12]];
                    var pos = items[getRandomArbitrary(0, 7)];

                    // ARTICULOS
                    for (var key in contents) {
                      if (key % 2 == 0) {
                        var teaserMidIzqOriginal = doc.getElementById('teaser-mid-izq');
                        var teaserMidIzqClone = teaserMidIzqOriginal.cloneNode(true); // "deep" clone
                        teaserMidIzqClone.id = 'teaser-mid-izq-' + key;
                        teaserMidIzqClone.classList.add("generated");
                        teaserMidIzqClone.style.display = "block";
                        teaserMidIzqClone.getElementsByClassName("teaser-izq-img")[0].setAttribute('data-src', contents[key].img);
                        var teaserMidIzqLink = "/home/content/html/" + contents[key].type + "/" + contents[key].slug + ".html";
                        teaserMidIzqClone.getElementsByClassName("teaser-izq-link")[0].setAttribute('href', teaserMidIzqLink);
                        teaserMidIzqClone.getElementsByClassName("teaser-izq-title")[0].innerHTML = contents[key].title;
                        teaserMidIzqOriginal.parentNode.appendChild(teaserMidIzqClone);
                      } else {
                        var teaserMidDerOriginal = doc.getElementById('teaser-mid-der');
                        var teaserMidDerClone = teaserMidDerOriginal.cloneNode(true); // "deep" clone
                        teaserMidDerClone.id = 'teaser-mid-der-' + key;
                        teaserMidDerClone.classList.add("generated");
                        teaserMidDerClone.style.display = "block";
                        teaserMidDerClone.getElementsByClassName("teaser-der-img")[0].setAttribute('data-src', contents[key].img);
                        var teaserMidDerLink = "/home/content/html/" + contents[key].type + "/" + contents[key].slug + ".html";
                        teaserMidDerClone.getElementsByClassName("teaser-der-link")[0].setAttribute('href', teaserMidDerLink);
                        teaserMidDerClone.getElementsByClassName("teaser-der-title")[0].innerHTML = contents[key].title;
                        teaserMidDerOriginal.parentNode.appendChild(teaserMidDerClone);
                      }
                    }
                    //=========================================================================================                       
                    // Subimos el fichero /index.html

                    var oSerializer = new XMLSerializer();
                    var sHTML = oSerializer.serializeToString(doc);

                    var now = new Date();
                    var nextweek = new Date(now.getFullYear(), now.getMonth(), now.getDate()+30);

                    // PAKO - DEFLATE FILE
                    // https://github.com/nodeca/pako
                    var pako = window.pako;
                    // Para usar pako.deflate, debemos indicarlo en putObject el atributo ContentEncoding con el valor deflate
                    var htmlData = pako.deflate(sHTML);
                    var paramsHTMLObject = { 
                      Bucket: $scope.bucket, 
                      Key: keyHome, 
                      Body: htmlData, 
                      ContentType: "text/html", 
                      ContentEncoding: "deflate", 
                      Expires: nextweek,
                      CacheControl: "max-age=2592000", // 30 dias: 60 * 60 * 24 * 30
                      // Metadata: {
                      //   'LastModified': now.toString(),
                      //   'ETag': hash
                      // }
                    };
                    s3.putObject(paramsHTMLObject, function (errSavingFile, dataPutObject) {
                      if (errSavingFile) {
                        if (debug) console.log('El fichero HTML ' + keyHome + ' NO existe en el bucket o no tiene permisos.');
                        if (debug) console.log('Error guardando el fichero')
                        if (debug) console.log(errSavingFile);
                      } else {
                        if (debug) console.log('%c HTML ', 'background: #222; color: #bada55', 'guardado correctamente en ' + keyHome);
                      }
                    }); // /putObject('contents.json)
                  }
                }); // Cargamos el fichero home/index.html
              }
            }); // /putObject('contents.json)
          }
        }); // /getObject('contents.json)
      }
    }); // / putObject('nuevo-contenido.json)
    
  }; // /submit
});