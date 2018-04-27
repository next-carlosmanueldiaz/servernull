/**
 * App Configuration file
 * Este fichero está en .gitignore (no se versiona): 
 *	Hay que subirlo directamente a s3 una vez configurado.
 */

/**
 * Variable for debug
 * @type Boolean
 */
var debug = false;

/**
 * Bucket Name
 * ie: 'servernull'
 * @type String
 */
var bucket = '';

/**
 * AWS Region
 * ie: 'eu-west-1'
 * @type String
 */
var region = '';

/**
 * Meta google-signin-client_id
 * Este MetaTag debe aparecer en las páginas que requieren autenticación.
 * https://console.developers.google.com/apis/dashboard
 * https://developers.google.com/identity/sign-in/web/sign-in#before_you_begin
 * https://eu-west-1.console.aws.amazon.com/cognito/home?region=eu-west-1# >--> Admins >--> App clients
 * ie: 664927400021-1a3vb18lv0cqk66uohjeiml94e5v9srq.apps.googleusercontent.com
 * @type String
 */
var googleSigninClientId = '';

/**
 * User Pool Id Admins
 * https://eu-west-1.console.aws.amazon.com/cognito/home?region=eu-west-1# >--> Admins >--> General settings
 * ie: 'eu-west-1_eRRsXwPcI'
 * @type String
 */
var userPoolId = ''; // User Pool Admins

/**
 * App Client Id of User Pool
 * https://eu-west-1.console.aws.amazon.com/cognito/home?region=eu-west-1# >--> Admins >--> App clients
 * ie: '7vmc6ico84ohef7ffgm2qag40c'
 * @type String
 */
var appClientId = ''; // UserPool "Admins"

/**
 * Identity Pool Id - Federated Identities
 * https://eu-west-1.console.aws.amazon.com/cognito/federated?region=eu-west-1
 * ie: 'eu-west-1:1066dbdf-1ffd-4fae-a113-e7100aec28d5'
 * @type String
 */
var IdentityPoolId = ''; // Identity Pool ServerNull

/**
 * ARN Role with policy for Admin assumed role
 * https://console.aws.amazon.com/iam/home?region=eu-west-1#/roles >--> accesoLimitadoACarpetaS3conFederatedIdentities
 * ie: 'arn:aws:iam::680501588637:role/accesoLimitadoACarpetaS3conFederatedIdentities'
 * @type String
 */
var roleArn = '';

/**
 * An identifier for the assumed role session
 * It can be the value whatever you want
 * ie: 'admins-assumed-role'
 * @type String
 */
var roleSessionName = '';

/**
 * Temporal password for new Admins. It will be ask change to Admin in first login.
 * The temporal password must be the same constraints that you setted in User Pool
 * ie: minimun length, require numbers, require Special Characters, require Uppercase letters...
 * ie: 'Temporal12$'
 * @type String
 */
var passwordTemporal = '';
