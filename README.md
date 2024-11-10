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
curl -u elastic:$ELASTIC_PASSWORD "$@" -X POST "${ELASTICSEARCH_URL}/_security/user/kibana_system/_password?pretty" -H 'Content-Type: application/json' -d"${change_data}"

To ingest existing data, run a connector service:
podman run -v ./config/mongodb_es_sync/charities-connectors-config:/config --network skillanthropy_elastic --tty --rm docker.elastic.co/enterprise-search/elastic-connectors:8.15.0.0 /app/bin/elastic-ingest -c /config