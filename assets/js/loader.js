/**
 * JavaScript Loader
 * by Carlos Manuel Díaz Jorge
 * CC - by-nc-nd
 */

var scripts = {
    "urls": [
        "https://code.jquery.com/jquery-1.9.1.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js",
        "https://cdn.rawgit.com/aws/aws-sdk-js/master/dist/aws-sdk.js",
        "https://cdn.rawgit.com/aws/amazon-cognito-identity-js/master/dist/aws-cognito-sdk.min.js",
        "https://cdn.rawgit.com/aws/amazon-cognito-identity-js/master/dist/amazon-cognito-identity.min.js",
        "../assets/js/config.js",
        "../assets/js/auth.js",
        "https://apis.google.com/js/platform.js?onload=onLogIn",
        "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js",
        "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js",
        "https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular.min.js",
        "../assets/js/contents.js",
        "../assets/js/interacciones.js",
    ]
};

var idGoogleGapi = "googleGapi";

var urls = scripts.urls;

for (var i = 0; i < urls.length; i+=1) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    // script.async = 'async';
    script.src = urls[i];
    script.onload = function () {
        console.log('Loaded script');
        console.log(this);
    };
    document.head.appendChild(script);
}