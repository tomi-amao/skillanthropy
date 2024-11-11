import { Client } from "@elastic/elasticsearch";
import { getElasticVars } from "./env.server";

// Initialize Elasticsearch client
const elastic = getElasticVars();
const client = new Client({
  node: "http://localhost:9200/",
  auth: {
    username: elastic.ELASTIC_USERNAME,
    password: elastic.ELASTIC_PASSWORD,
  },
});

//search tasks based on provided taskIds, which is retrieved from task applications or task associated charity id
export const searchUserTaskApplications = async (
  query: string,
  taskIds: string[] | undefined,
) => {
  if (!taskIds) {
    return { message: "No task ids provided", status: 400 };
  }
  if (await client.ping()) {
    try {
      const searchResult = await client.search({
        index: "skillanthropy_tasks",
        body: {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query: query,
                    fields: "*",
                  },
                },
                {
                  terms: {
                    id: taskIds,
                  },
                },
              ],
            },
          },
        },
      });

      const searchedDocuments = searchResult.hits.hits;
      const rawSearchedDocuments = searchedDocuments
        .map((document) => {
          return document._source;
        })
        .filter(Boolean);
      // console.log("Documents", rawSearchedDocuments);

      return { searchResult, searchedDocuments, rawSearchedDocuments };
    } catch (error) {
      console.log("Could not connect to elastic client", error);
      return { message: "Could not connect to elastic client", status: 400 };
    }
  }
};
