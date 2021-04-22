---
layout: post
title:  "Integrating Airflow with OKTA"
author: Kuntalb, Greg Reznik
tags:
- OKTA
- Airflow
- featured
team: Core Platform, IT
---
At Scribd we decided to pair Airflow with OKTA. Earlier we were using LDAP for authentication. This write up will describe the journey of integrating Airflow with OKTA from the earlier LDAP setup.


## Prerequisite:
1. OKTA with api access management 
2. [Flask-AppBuilder 3.2.2](https://github.com/dpgaspar/Flask-AppBuilder/tree/v3.2.2). Official Airflow repo has a [constraint](https://github.com/apache/airflow/blob/master/setup.cfg#L97) on flask-appbuilder~=3.1,>=3.1.1 , so we might need to use a fork to get this integration going.
3. sqlalchemy>=1.3.18, <1.4.0
4. authlib==0.15.3

## OKTA Setup

![Sample OKTA Setup](/post-images/Sample-OKTA-Setup/Sample-OKTA-Setup.png)
<font size="3"><center><i>Sample OKTA Setup </i></center></font>

1. Create an OIDC Web application. Give it a name and leave the values under the “Configure OpenID Connect” section empty.
2. Make note of the Client ID and the Client Secret, as you will need them for configuring the airflow webserver.
3. In the “Allowed Grant Types” section, make sure you check all of the boxes.
4. For the Login redirect URIs field, you will enter: https://your-airflow-url-goes-here.com/oauth-authorized/okta
5. For the Initiate login URI field, you will enter: https://your-airflow-url-goes-here.com/login

## Airflow Configuration

### conf/webserver_config.py
    
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

### Special Steps:


1. We started with Flask-AppBuilder 3.2.1,however it had a bug that needs to be fixed, we raised a [PR] (https://github.com/dpgaspar/Flask-AppBuilder/pull/1589)Flask-AppBuilder: fix: load user info for oktaCLOSED  to resolve that issue. That PR got merged and now we can use the new release, Flask-AppBuilder 3.2.2

2. As we were migrating from LDAP, we will already have user info populated, however OKTA generates a new user id something like thisokta_00u1046sqzJprt1hZ4x6 , but as the email id corresponding to that user id is already present we got the below error. To prevent this we logged into the underlying database for Airflow and cleaned up the ab_user and ab_user_role table and let OKTA integration recreate the user during first sign up. 

    ```
    [2021-03-19 16:32:28,559] {manager.py:215} ERROR - Error adding new user to database. (sqlite3.IntegrityError) UNIQUE constraint failed: ab_user.email
    [SQL: INSERT INTO ab_user (first_name, last_name, username, password, active, email, last_login, login_count, fail_login_count, created_on, changed_on, created_by_fk, changed_by_fk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)]
    [2021-03-19 16:32:28,560] {manager.py:1321} ERROR - Error creating a new OAuth user okta_00u1046sqzJprt1hZ4x6 
    ```
3. Because we have deleted all the existing user and role, once the users logged in for the first time, especially for the first admin user we did the following from the airflow cli. This will create the first admin user after that if needed we can propagate other user and roles from the Airflow web console from this admin user account.
    ```
     airflow users add-role -r Admin -u okta_00u1046sqzJprt1hZ4x6
    ```

## Known Issue:

1. Currently in the audit log, any action triggered on Airflow has OKTA user id. Airflow needs to be patched to write out audit log entries with human readable user identifiers instead.

---

Within Scribd's Platform Engineering group we have a *lot* more services than
people, so we're always trying to find new ways to automate our infrastructure.
If you're interested in helping to build out scalable data platform to help
change the world reads, [come join us!](/careers/#open-positions)
