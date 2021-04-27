---
layout: post
title:  "Integrating Airflow with Okta"
author: kuntalb
tags:
- okta
- airflow
- featured
team: Core Platform
---


At Scribd we use Airflow as a scheduler for most of our batch workloads, 
this blog is not about Airflow so we are not getting into why Airflow. 
This is about one of the biggest challenge that we faced while using Airflow and finally conquer. 
That is how to do authentication and authorisation for Airflow. 
Of course Airflow does support LDAP and at Scribd we started using LDAP with Airflow initially, 
but as the organisation grow and more and more user started using Airflow, 
it became imperative that we integrate Airflow with our SSO provider that is Okta. 

Sadly there is a lack of resources on how to implement airflow with Okta specifically. 
This write up will describe the journey of integrating Airflow with Okta from the earlier LDAP setup.


## Prerequisite
This section will describe the minimum setup that will require to enable this integration. 
1. Okta with [API Access Management](https://developer.okta.com/docs/concepts/api-access-management/) enabled. 
Without this feature enabled in OKTA we will not be able to integrate Airflow with Okta

We are going to use Flask app builder along with some additional packages to integrate it via Okta.
In Scribd we use a custom build docker image for Airflow, we install the following libraries in that docker image to make Airflow integration work with Okta
1. [Flask-AppBuilder
   3.2.2](https://github.com/dpgaspar/Flask-AppBuilder/tree/v3.2.2). Official
   Airflow repo has a
   [constraint](https://github.com/apache/airflow/blob/master/setup.cfg#L97) on
   `flask-appbuilder~=3.1,>=3.1.1`, so adding this additionally to the docker image helps us bypass that constraint
1. `sqlalchemy>=1.3.18, <1.4.0` --> This is because of some python dependency for Flask-AppBuilder
1. `authlib==0.15.3` --> authlib needs to installed along with Airflow to enable flask-appbuilder integration with Okta via OIDC

## Okta Setup

![Sample Okta Setup](/post-images/2021-04-okta-airflow/sample-okta-setup.png)
<font size="3"><center><i>Sample Okta Setup </i></center></font>

1. Create an OIDC Web application. Give it a name and leave the values under the “Configure OpenID Connect” section empty.
1. Make note of the Client ID and the Client Secret, as you will need them for configuring the airflow webserver.
1. In the “Allowed Grant Types” section, make sure you check all of the boxes.
1. For the Login redirect URIs field, you will enter: `https://your-airflow-url-goes-here.com/oauth-authorized/okta`
1. For the Initiate login URI field, you will enter: `https://your-airflow-url-goes-here.com/login`

## Airflow Configuration

`conf/webserver_config.py`

    AUTH_TYPE = AUTH_OAUTH
    OAUTH_PROVIDERS = [
    {'name': 'okta', 'icon': 'fa-circle-o',
            'token_key': 'access_token',
            'remote_app': {
                'client_id': <<>>,
                'client_secret': <<>>,
                'api_base_url': 'https://<<okta_url>>/oauth2/v1/',
                'client_kwargs': {
                    'scope': 'openid profile email groups'
                },
                'access_token_url': 'https://<<okta_url>>/oauth2/v1/token',
                'authorize_url': 'https://<<okta_url>>/oauth2/v1/authorize',
        }
        }
    ]

A special thanks to Greg Reznik for handling everything related to Okta configuration

### Special Steps

1. We started with Flask-AppBuilder 3.2.1, however it had a bug that needs to
   be fixed, we raised a [PR for Flask-AppBuilder](https://github.com/dpgaspar/Flask-AppBuilder/pull/1589) to resolve that issue. That PR got merged and now we can use the new release, Flask-AppBuilder 3.2.2

2. As we were migrating from LDAP, we will already have user info populated,
   however Okta generates a new user id something like
   this `okta_00u1046sqzJprt1hZ4x6`, but as the email id corresponding to that
   user id is already present we got the below error. To prevent this we logged
   into the underlying database for Airflow and cleaned up the `ab_user` and
   `ab_user_role` table and let Okta integration recreate the user during first
   sign up.

    ```
    [2021-03-19 16:32:28,559] {manager.py:215} ERROR - Error adding new user to database. (sqlite3.IntegrityError) UNIQUE constraint failed: ab_user.email
    [SQL: INSERT INTO ab_user (first_name, last_name, username, password, active, email, last_login, login_count, fail_login_count, created_on, changed_on, created_by_fk, changed_by_fk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)]
    [2021-03-19 16:32:28,560] {manager.py:1321} ERROR - Error creating a new OAuth user okta_00u1046sqzJprt1hZ4x6
    ```
3. Because we have deleted all the existing user and role, once the users logged in for the first time,
   especially for the first admin user we did the following from the airflow cli. 
   This will create the first admin user after that if needed we can propagate other user and roles from the Airflow web console from this admin user account.
    ```
     airflow users add-role -r Admin -u okta_00u1046sqzJprt1hZ4x6
    ```

## Known Issue

1. Currently in the audit log, any action triggered on Airflow has Okta user id. Airflow needs to be patched to write out audit log entries with human readable user identifiers instead.

## Final Stage

Once the setup is complete, you will find the similar tiles on your okta dashboard,

![Sample Okta Tiles](/post-images/2021-04-okta-airflow/okta-tiles.png)
<font size="3"><center><i>Sample Okta Tiles </i></center></font>

Once you select the tiles, it should redirect you to the below page

![Sample Okta Login Page](/post-images/2021-04-okta-airflow/airflow-login.png)
<font size="3"><center><i>Okta Login Page </i></center></font>

Hope this doc will help you integrating Okta with Airflow, This journey was a bit tricky one for us but we finally make it happen and we do hope that this doc will help a lot of folks to integrate Airflow with Okta successfully.

---

Within Scribd's Platform Engineering group we have a *lot* more services than
people, so we're always trying to find new ways to automate our infrastructure.
If you're interested in helping to build out scalable data platform to help
change the world reads, [come join us!](/careers/#open-positions)
