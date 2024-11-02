export function getZitadelVars() {
  return {
    ZITADEL_DOMAIN: process.env.ZITADEL_DOMAIN ?? "",
    CLIENT_ID: process.env.CLIENT_ID ?? "",
    REDIRECT_URI: process.env.REDIRECT_URI ?? "",
    LOGOUT_URI: process.env.LOGOUT_URI ?? "",
    STATE: process.env.STATE ?? "",
    MACHINE_API_KEY: process.env.MACHINE_API_KEY ?? "",
  };
}
export function getElasticVars() {
  return {
    ELASTIC_PASSWORD: process.env.ELASTIC_PASSWORD ?? "",
    ELASTIC_USERNAME: process.env.ELASTIC_USERNAME ?? "",

  };
}
