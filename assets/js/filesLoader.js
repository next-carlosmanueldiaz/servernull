/**
 * https://stackoverflow.com/questions/14521108/dynamically-load-js-inside-js
 */
function filesLoader() {

    var opts = {
        verbose: false
    };                          ///< The options required to run this function
    var self = this;            ///< An alias to 'this' in case we're in jQuery                         ///< Constants required for this function to work

    this.getOptions = function() {
        return opts;
    };

    this.setOptions = function(options) {
        for (var x in options) {
            opts[x] = options[x];
        }
    };

    /**
     * @brief Load the required files for this plugin
     * @param {Function} callback A callback function to run when all files have been loaded
     */
    this.loadRequiredFiles = function (callback) {
        var scripts = ['xx.js', 'yy.js'];
        var styles = ['zz.css'];
        var filesloaded = 0;
        var filestoload = scripts.length + styles.length;
        for (var i = 0; i < scripts.length; i++) {
            log('Loading script ' + scripts[i]);
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = scripts[i];
            script.onload = function () {
                log('Loaded script');
                log(this);
                filesloaded++;
                finishLoad();
            };
            document.head.appendChild(script);
        }
        for (var i = 0; i < styles.length; i++) {
            log('Loading style ' + styles[i]);
            var style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = styles[i];
            style.type = 'text/css';
            style.onload = function () {
                log('Loaded style');
                log(this);
                filesloaded++;
                finishLoad();
            };
            document.head.appendChild(style);
        }
        function finishLoad() {
            if (filesloaded === filestoload) {
                callback();
            }
        }
    };

    /**
     * @brief Enable user-controlled logging within this function
     * @param {String} msg The message to log
     * @param {Boolean} force True to log message even if user has set logging to false
     */
    function log(msg, force) {
        if (opts.verbose || force) {
            console.log(msg);
        }
    }

    /**
     * @brief Initialise this function
     */
    this.init = function() {
        self.loadRequiredFiles(self.afterLoadRequiredFiles);
    };

    this.afterLoadRequiredFiles = function () {
        // Do stuff
    };

}