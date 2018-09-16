ServerNull! 
=================== 
## Introduction 

ServerNull v1.0.4

The idea is to create a standar for webs applications with the minimal resources, less even than serverless.
Using only S3 and Cognito, using only Javascript from client-side is posible to create multiple webs applications hosted in S3, as backend and also frontend. For example, applications with restricted access to manage aws services, get aws results like statistics, or even web applications more advanced, and allways with the minimum cost and maintenance.

For a lot of micro applications its no necesary more.. but if there are applications more complex, its very easy to escale this model using lambdas, or web services, doc storages, etc.

This case can be usefull for example to generate dinamic statistics as screenshots for example, customized by the client. There are a lot of diferents cases, even build a shop cart for logued users.

## Table of contents

[ServerNull!](#introduction)

 - [Table of Contents](#table-of-contents) 
 - [Executive presentation](#executive-presentation)
 - [Requirements](#requirements)
 - [Configuration Tasks](#configuration-tasks)
	 - [Create an Amazon S3 bucket](#-create-an-amazon-s3-bucket)
	 - [Configuring CORS](#-configuring-cors)
	 - [Edit bucket Policy](#-edit-bucket-policy)
	 - [Create a Google Developers Project and OAuth Web Client ID](#-create-a-google-developers-project-and-oauth-web-client-id)
	 - [Create a Amazon Cognito Identity Pool](#-create-a-amazon-cognito-identity-pool)
	 - [Create the Admins User Pool](#-create-the-admins-user-pool) 
 - [Admins Policy](#admins-policy)
 - [Admins Role](#admins-role)
 - [Application Configuration](#application-configuration)
 - [Upload and Lauch](#upload-and-lauch)
 - [Sign-up Users in User Pool](#sign-up-users-in-user-pool)
 - [Demo](#demo)


----------
[Executive presentation](#table-of-contents)
--------------------
Here is the [executive presentation of this PoC](https://docs.google.com/a/bbva.com/presentation/d/1RiIOo2dbC09ZPQ9FlhmHDoHdsAYtA-VQicrdtTAx32Y/edit?usp=sharing).

[Requirements](#table-of-contents)
--------------------

 - A Google Application
 - A AWS account with access to S3
 - A AWS account with access to Cognito (User Pools & Identity Pools)

> **Note:**
> - Possibly it will be necessary to create a Lambda to find out if an authenticated user is in the list of Admins (User Pool) to make a really secure login.

 - Automatic s3 upload 
   We can use the pre-push git hook to upload all files changed in the project. To do this, you must:
	- put pre-push hook in hooks folder on .git folder of the project.
	- create a virtualenv inside the project
	- install pipenv
	- install aws cli
	- configure ~/.aws/credentials
	- every push you do in the project will be copy to s3 the changed files.

[Configuration Tasks](#table-of-contents)
--------------------
To set up and run this example, you must first complete these tasks:
#### <i class="icon-folder-open"></i> [Create an **Amazon S3 bucket**](#table-of-contents)

Create an Amazon S3 bucket (ie name: **server-null**) in the console that you will use to store the web application. 
Set the bucket property to **Static website hosting**.

![enter image description here](https://s3-eu-west-1.amazonaws.com/server-null/img/Static-Website-Hosting.png)

Write down the endpoint url provided in this configuration. 
ie: http://server-null.s3-website-eu-west-1.amazonaws.com

#### <i class="icon-file"></i> [Configuring **CORS**](#table-of-contents)
Before the browser script can access the Amazon S3 bucket, you must first set up its CORS configuration as follows.
```
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>POST</AllowedMethod>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedMethod>DELETE</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>
```
#### <i class="icon-file"></i> [Edit **bucket Policy**](#table-of-contents)
Edity the bucket policy to give permissions to see all S3 public parts:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicListGet",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:List*",
                "s3:Get*"
            ],
            "Resource": [
                "arn:aws:s3:::server-null/assets/*",
                "arn:aws:s3:::server-null/home",
                "arn:aws:s3:::server-null/home/*",
                "arn:aws:s3:::server-null/backend",
                "arn:aws:s3:::server-null/backend/*",
                "arn:aws:s3:::server-null/googledcdc34f21bd3768f.html"
            ]
        }
    ]
}
```
#### <i class="icon-file"></i> [Create a **Google Developers Project** and OAuth Web Client ID](#table-of-contents)
To enable Google Sign-In in your web app, create a project in the Google Developers Console. 

For all platforms, enable the **Google+ API** for and an **OAuth web client ID** for your Google project. Amazon Cognito federates the web client ID to enable your app to use Google authentication to grant access to your AWS resources.
Steps to Create a Google Developers Project and OAuth Web Client ID

 1. Go to the [Google Developers console](https://console.developers.google.com/) and create a new project
 2. Under APIs and auth > APIs > Social APIs, enable the Google+ API.
 3. Under **APIs and auth** > **Credentials** > **OAuth consent screen**, create the dialog that will be shown to users when your app requests access to their private data.
 4. Under **Credentials** > **Add Credentials**, create an OAuth 2.0 client ID for your web application. You will need a client ID for each platform you intend to develop for (e.g. web, iOS, Android).
 6. You need an OAuth web application client ID for Amazon Cognito. In **Credentials**, choose client ID from the links in the first step.
 7. In **OAuth consent screen**, enter the name of your app in Product name shown to users. Leave the remaining fields blank. Then choose Save.
 8. Click on **Domain verification**, next click on Add domain button. On popup,  set the S3 domain, and then click on ADD DOMAIN. To verify ownership, you must click on TAKE ME THERE in the next popup. You must set again the S3 domain and Google will give you a file that you must upload to the root of S3 and verify your domain.
 8. Write down the **Google Id**, you'll need it to set in Cognito Identity Pool and User Pool configuration. 
 i.e: 664927400021-1a3vb18lv0cqk66uohjeiml94e5v9srq.apps.googleusercontent.com
 
#### <i class="icon-file"></i> [Create a **Amazon Cognito Identity Pool**](#table-of-contents)
Create an Amazon Cognito identity pool using Federated Identities with access enabled for unauthenticated users. You need to include the identity pool ID in the code to obtain credentials for the browser script.

To create a new identity pool for your application:

 1. Log in to the Amazon Cognito console, choose **Manage Federated Identities**, and choose **Create new identity pool**.
 2. Enter a name for your identity pool, select the checkbox to **enable access to unauthenticated identities** or configure an identity provider.
 3. Choose **Allow** to create the two default roles associated with your identity pool—one for **unauthenticated** users and one for **authenticated** users. These default roles provide your identity pool access to Amazon Cognito Sync. You can modify the roles associated with your identity pool in the [IAM console](https://console.aws.amazon.com/iam/home).
 4. In the Authentication providers section, set the **Google Client ID** in Google + Provider.
 5. Choose **Create Pool**.
 6. Write down the **Identity Pool Id**. You will need that to configure your code.
 i.e.: eu-west-1:1066dbdf-1ffd-4fae-a113-e7100aec28d5
 7. Edit the **authenticated** users Policy:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "mobileanalytics:PutEvents",
                "cognito-sync:*",
                "cognito-identity:*",
                "cognito-idp:ListUsers"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```

#### <i class="icon-file"></i> [Create the Admins **User Pool**](#table-of-contents)

In Amazon Cognito Console:

 1. Click on **Create a user pool button**.
 2. Fill Pool Name and click on **Review defaults**.
 3. In **App client** section, click on **Add app client** link and next to **Add an app client** link.
 4. Fill **App client name** with the Google Id, and uncheck **Generate client secret**.
 5. Hit the **Create pool** button.
 6. In **Federation** > **Identity Providers**, click on **Google**, and fill the **Google app ID**, **App Secret** from your Google App created and **Authorize scope** as "**token**".
 7. On **Attribute mapping**, click on **Google** and set only email as Google Attribute.

-------

[Admins Policy](#table-of-contents)
--------------------
Its necesary to create a policy with permissions for Admins.

 1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/home?region=eu-west-1#/home)
 2. Click on Policies link
 3. Click on Create policy
 4. Select Create Your Own Policy
 5. Type the Policy Name and Description for the Admin Permissions Policy
 6. Set the Policy Document with the next JSON and write down the Policy Name for the next section.
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PermisoVerCarpetas",
            "Effect": "Allow",
            "Action": [
                "s3:ListObjects"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Sid": "PermisoObtenerFicheros",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::server-null/backend/*"
            ]
        },
        {
            "Sid": "PermisosGuardarBorrarFicheros",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::server-null/private/*",
                "arn:aws:s3:::server-null/home/content/*"
            ]
        }
    ]
}
```
[Admins Role](#table-of-contents)
--------------------
Now you must create a role with the policy created:
 1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/home?region=eu-west-1#/home)
 2. Click on Roles
 3. Click on Create role
 4. Choose the service that will use this role and select S3. Click on Next: Permissions
 5. Filter by the Policy name created in the previous section and select that policy
 6. Type Role name and Description (ie: AdminsAssumedRolePermissions) and Set Create role.
 7. Write down the **Role ARN** from Role Summary. It will be necesary to Application configuration.
 8. Click on **Trust relationships**, then on **Edit trust relationship** and set the next policy:
```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "accounts.google.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "accounts.google.com:aud": "YOUR_GOOGLE_APP.apps.googleusercontent.com"
        }
      }
    }
  ]
}
```
Click on **Update Trust Policy**.

[Application Configuration](#table-of-contents)
--------------------
Now we will set the application configuration:

 1. Edit **/assets/js/config.default.js** file
 2. Fill all variables with your bucket, user pool, identity pool and Admin rol data
 3. Save this file as **config.js** and upload to your bucket.
 4. Configuration variables

 - region: is the region where is hosted Amazon S3.
 - userPoolId: Id of the Admins User Pool
 - IdentityPoolId: Id of the Identity Pool
 - appClientId: Id of the App Client defined in Admin User Pool
 - roleArn: role Arn with credentials to access permissions.
 - roleSessionName: Name of session 

[Upload and Lauch](#table-of-contents)
--------------------
Upload all files of this repository to the bucket.
Go to [https://**your-bucket-name**.s3-**your-region**.amazonaws.com/home/index.html](https://your-bucket-name.s3-your-region.amazonaws.com/home/index.html) 	

[Sign-up Users in User Pool](#table-of-contents)
--------------------
Sign-up users in the User Pool:

 1. Go to [AWS Cognito Console](https://eu-west-1.console.aws.amazon.com/cognito/home?region=eu-west-1)
 2. Click on "Manage your User Pools.
 3. Click on Admins User Pool
 4. Click on Users and groups
 5. Click on Create User
 6. Fill Username with the email of the user to sign-up and check "Send an invitation to this new user
 7. Fill Temporary password with **Temporal12$**
 8. Fill Email with the email of the user to sign-up and Mark email as verified.
 9. Click on create user

This action will send a email to the user with the password **Temporal12$**.
Then the user can go to register page and it will ask to set a new password.
ie: [https://server-null.s3-eu-west-1.amazonaws.com/home/register.html](https://server-null.s3-eu-west-1.amazonaws.com/home/register.html)

[Demo](#table-of-contents)
--------------------
You can see the demo page at [https://server-null.s3-eu-west-1.amazonaws.com/home/index.html](https://server-null.s3-eu-west-1.amazonaws.com/home/index.html)

If you want to be a Admin and manage the Application Backend, you will need to ask **Admin sign-up** to [carlos.manuel@beeva.com](mailto:carlos.manuel@beeva.com)
