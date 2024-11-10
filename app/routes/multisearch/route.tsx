import { LoaderFunctionArgs } from "@remix-run/node";
import { getElasticVars } from "~/services/env.server";
import { Client } from "@elastic/elasticsearch";

// Initialize Elasticsearch client
const elastic = getElasticVars();
const client = new Client({
  node: "http://localhost:9200/",
  auth: {
    username: elastic.ELASTIC_USERNAME,
    password: elastic.ELASTIC_PASSWORD,
  },
});

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("search") || "";
  // console.log(query);

  // Multi-index search
  if (await client.ping()) {
    try {
      const searchResult = await client.search({
        index:
          "skillanthropy_tasks,skillanthropy_users,skillanthropy_charities", // specify multiple indices
        body: {
          query: {
            multi_match: {
              query: query,
              fields: ["*", "*", "*"], // specify fields based on each index
            },
          },
        },
      });
      const searchedDocuments = searchResult.hits.hits;
      // console.log("Search hits",searchResult.hits);
      const rawSearchedDocuments = searchedDocuments
        .map((document) => {
          return { collection: document._index, data: document._source };
        })
        .filter(Boolean);
      // console.log("Documents", rawSearchedDocuments);

      return { searchResult, searchedDocuments, rawSearchedDocuments };
    } catch (error) {
      console.log("Could not connect to elastic client");
      return {message: "Could not connect to elastic client", status: 400 }
      
    }
  } 
  return null
  // console.log(searchResult.hits.hits);

  // searchResult.hits.hits.map((result) => {
  //   console.log(result._source);
  // });
}

export default function MultiSearch() {
  // const fetcher = useFetcher();
  // const { searchResult, searchedDocuments, rawSearchedDocuments } =
  //   useLoaderData<typeof loader>();
  // // const handleSearch = (e: ChangeEvent<HTMLInputElement>, property: string) => {
  // //   // console.log(e.target.value);

  // //   // setSearch((preValue) => { return (setSearch((preValue) => {...preValue, [property]: e.va}))} )
  // //   setSearch((preValue) => {
  // //     return { ...preValue, [property]: e.target.value };
  // //   });
  // // };
  // // const rawSearchedDocuments = searchedDocuments.map(
  // //   (document) => document._source,
  // // );

  // // console.log("Result query",rawSearchedDocuments);

  // useEffect(() => {
  //   // console.log(search);
  //   fetcher.load(`/multisearch?search=${search.query}`);
  // }, [search]);
  return (
    <>
      {/* <Navbar isLoggedIn={false} searchValue={search} /> */}
      <div className="pt-20 flex flex-col ">{/* <SearchDropdown /> */}</div>
    </>
  );
}
