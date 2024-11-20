# Skillanthropy

This website serves as a dynamic hub where software engineers, data scientists, UX/UI designers, and other tech professionals can discover and engage in volunteer opportunities with non-profit organizations and charities. It's essentially a task board tailored for tech-related projects that make a positive impact on society.

# The following environemnt variables are needed to run the docker image

## Mongodb Environment Variables

DATABASE_URL=
SESSION_SECRET=

## Zitadel Environment variables - redirect and logout uri variables need to be present in zitadel

ZITADEL_DOMAIN=
CLIENT_ID=
REDIRECT_URI=
LOGOUT_URI=
STATE=

## Search engine docker compose values

ELASTICSEARCH_VERSION=
ELASTIC_PASSWORD=
KIBANA_VERSION=
CONNECTORS_VERSION=
ELASTIC_USERNAME=

To access Kibana, run the following:
ELASTICSEARCH_URL="http://localhost:9200"
ELASTIC_PASSWORD=your_password
change_data="{ \"password\": \"${ELASTIC_PASSWORD}\" }"
curl -u elastic:$ELASTIC_PASSWORD "$@" -X POST "${ELASTICSEARCH_URL}/\_security/user/kibana_system/\_password?pretty" -H 'Content-Type: application/json' -d"${change_data}"

To ingest existing data, run a connector service:
podman run -v ./config/mongodb_es_sync/charities-connectors-config:/config --network skillanthropy_elastic --tty --rm docker.elastic.co/enterprise-search/elastic-connectors:8.15.0.0 /app/bin/elastic-ingest -c /config

Elastic Set up steps

1. Run docker compose 
2. Access Kibana at localhost:5601 
    1. Update Kibana password if needed run: 
        1.  curl -u elastic:$ELASTIC_PASSWORD "$@" -X POST "${ELASTICSEARCH_URL}/_security/user/kibana_system/_password?pretty" -H 'Content-Type: application/json' -d"${change_data}"
3. Create and Configure Elastic connector using api
    1. Send API requests against elastic service to create and configure elastic connector
4. Update connector configuration with new api key from elastic
5. Create elastic connector service container:  
    1. podman run --name charities-connector  -v ./config/mongodb_es_sync/charities-connectors-config:/config --network skillanthropy_elastic --tty --rm docker.elastic.co/enterprise-search/elastic-connectors:8.15.0.0 /app/bin/elastic-ingest -c /config
    2. podman run --name tasks-connector -v ./config/mongodb_es_sync/tasks-connectors-config:/config --network skillanthropy_elastic --tty --rm docker.elastic.co/enterprise-search/elastic-connectors:8.15.0.0 /app/bin/elastic-ingest -c /config
    3. podman run --name users-connector -v ./config/mongodb_es_sync/users-connectors-config:/config --network skillanthropy_elastic --tty --rm docker.elastic.co/enterprise-search/elastic-connectors:8.15.0.0 /app/bin/elastic-ingest -c /config
    4. podman run --name taskApplications-connector -v ./config/mongodb_es_sync/taskApplications-connectors-config:/config --network skillanthropy_elastic --tty --rm docker.elastic.co/enterprise-search/elastic-connectors:8.15.0.0 /app/bin/elastic-ingest -c /config
6. Sync elastic connector 


Zitadel set up steps

1. Run Docker compose
2. Access Zit behind Traefik at http://127.0.0.1.sslip.io:8000 
3. Generate PAT token of service account
4. Import organisation config using pat token through postman
5. Make skillanthropy default organisation
6. Add default redirect uri at the bottom of the login behaviour and security sections
7. Update client id using the imported organisation named skillanthropy