/**
 * JavaScript Loader
 * by Carlos Manuel Díaz Jorge
 * CC - by-nc-nd
 * https://stackoverflow.com/questions/14521108/dynamically-load-js-inside-js
 */

var js = {
    "librerias": [
        // No dependientes entre si
        "https://apis.google.com/js/platform.js?onload=onLogIn",
        "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js",
        "https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js",
        "https://code.jquery.com/jquery-1.9.1.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js",
        "https://cdn.rawgit.com/aws/aws-sdk-js/master/dist/aws-sdk.js",
        "../assets/js/deferImages.js",
        "../assets/js/config.js",
    ],
    "scripts": [
        "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js",
        "https://cdn.rawgit.com/aws/amazon-cognito-identity-js/master/dist/aws-cognito-sdk.min.js",
        "https://cdn.rawgit.com/aws/amazon-cognito-identity-js/master/dist/amazon-cognito-identity.min.js",
        "../assets/js/auth.js",
        "../assets/js/contents.js",
        "../assets/js/interacciones.js",
    ]
};

var librerias = js.librerias;
var libsloaded = 0;
var libstoload = librerias.length;

// Cargamos todas las librerías base
//-----------------------------------------------------------------
for (var i = 0; i < librerias.length; i++) {
    var lib = document.createElement('script');
    lib.type = 'text/javascript';
    lib.async = 'async'; // Pueden cargarse todas de manera asíncrona.
    lib.src = librerias[i];
    if (librerias[i] == "https://apis.google.com/js/platform.js?onload=onLogIn") {
        lib.id = "googleGapi";
    }
    document.head.appendChild(lib);
    console.log('Cargando librería ' + i + " -> " + lib.src);

    // Cada vez que se carga una librería, la contamos
    lib.onload = function () {
        libsloaded++;
        console.log('Librería ' + libsloaded + ' cargada: ' + this.src);
        if (libsloaded === libstoload) {
            loadScripts();
        }
    };
}

/** 
 * Una vez finalizada la carga de todas las librerías, 
 * cargamos los scripts que las usan.
*/
function loadScripts() {
    var scripts = js.scripts;
    // Recorremos todos los scrpts de autor
    for (var j = 0; j < scripts.length; j++) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = "async";
        script.src = scripts[j];
        document.head.appendChild(script);
        console.log('Script ' + j + " -> " + script.src);
    }
}