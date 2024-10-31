import { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { DropdownCard } from "~/components/cards/FilterCard";
import TaskSummaryCard from "~/components/cards/taskCard";
import Navbar from "~/components/navigation/Header2";
import {
  CancelButton,
  SecondaryButtonAlt,
} from "~/components/utils/BasicButton";
import { CloseIcon, FilterIcon, SortIcon } from "~/components/utils/icons";
import {
  statusOptions,
  taskCategoryFilterOptions,
  taskCharityCategories,
  urgencyOptions,
} from "~/components/utils/OptionsForDropdowns";
import Dropdown from "~/components/utils/selectDropdown";
import { getAllTasks } from "~/models/tasks.server";
import { getUserInfo } from "~/models/user2.server";
import { getSession } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");
  const { allTasks } = await getAllTasks();
  if (!accessToken) {
    return { allTasks, message: "No access token found", userInfo: null };
  }
  const { userInfo } = await getUserInfo(accessToken);

  // console.log("First", allTasks);

  return { allTasks, userInfo };
}

export default function Explore() {
  const { userInfo } = useLoaderData<typeof loader>();
  const [showClearFilters, setShowClearFilters] = useState<boolean>();
  const fetcher = useFetcher();

  // State to store selected filter options
  const [filters, setFilters] = useState({
    skills: [],
    charity: [],
    urgency: [],
    status: [],
    deadline: [],
    createdAt: [],
    updatedAt: [],
  });

  const clearFilters = () => {
    setFilters({
      skills: [],
      charity: [],
      urgency: [],
      status: [],
      deadline: [],
      createdAt: [],
      updatedAt: [],
    });
  };

  const sortList = ["deadline", "createdAt", "updatedAt"];

  // Function to handle option selection
  const onSelect = (option: string, selected: boolean, filter: string) => {
    if (sortList.includes(filter)) {
      setFilters((preValue) => {
        return {
          ...preValue,
          ["deadline"]: [],
          ["updatedAt"]: [],
          ["createdAt"]: [],
        };
      });
    }

    setFilters((prevFilters) => {
      const currentOptions = prevFilters[filter];

      // check if the option is already selected
      const isSelected = currentOptions.includes(option);

      // update the array by either adding or removing the selected option
      if (filter == "charity" || filter == "skills") {
        const updatedOptions = isSelected
          ? currentOptions.filter((item: string) => item !== option) // remove if selected
          : [...currentOptions, option]; // add if not selected

        return {
          ...prevFilters,
          [filter]: updatedOptions, // update the specific filter type
        };
      } else {
        const updatedOptions = isSelected ? "" : option;
        return { ...prevFilters, [filter]: [updatedOptions] };
      }
    });
  };

  // use effect to trigger search when filters change
  useEffect(() => {
    fetcher.load(
      `/search?skills=${filters.skills.join(",")}&charity=${filters.charity.join(",")}&deadline=${filters.deadline.join(",")}&status=${filters.status.join(",")}&urgency=${filters.urgency.join(",")}&createdAt=${filters.createdAt.join(",")}&updatedAt=${filters.updatedAt.join(",")}`,
    );
    const checkFilters =
      filters &&
      Object.keys(filters).every(
        (key) => Array.isArray(filters[key]) && filters[key].length === 0,
      );
    setShowClearFilters(!checkFilters);
    console.log(filters);
  }, [filters]); // re-run when filters change

  const filterOptionsToggle = (handleToggle: () => void) => {
    return (
      <SecondaryButtonAlt
        ariaLabel="filter button"
        text="Filter"
        icon={<FilterIcon />}
        action={handleToggle}
      />
    );
  };
  const sortOptionsToggle = (handleToggle: () => void) => {
    return (
      <SecondaryButtonAlt
        ariaLabel="sort button"
        text="Sort"
        icon={<SortIcon />}
        action={handleToggle}
      />
    );
  };

  const filterOptions = [
    <Dropdown
      key="charity"
      options={taskCharityCategories}
      placeholder="Charity"
      onSelect={(option, selected) => onSelect(option, selected, "charity")}
      multipleSelect={true}
      horizontal={true}
      defaultSelected={filters.charity}
    />,
    <Dropdown
      key="skills"
      options={taskCategoryFilterOptions}
      placeholder="Skills"
      onSelect={(option, selected) => onSelect(option, selected, "skills")}
      multipleSelect={true}
      horizontal={true}
      defaultSelected={filters.skills}
    />,
    <Dropdown
      key="urgency"
      options={urgencyOptions}
      placeholder="Urgency"
      onSelect={(option, selected) => onSelect(option, selected, "urgency")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.urgency}
    />,
    <Dropdown
      key="status"
      options={statusOptions}
      placeholder="Status"
      onSelect={(option, selected) => onSelect(option, selected, "status")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.status}
    />,
  ];
  const sortOptions = [
    <Dropdown
      key="createdAt"
      options={["asc", "desc"]}
      placeholder="Created At"
      onSelect={(option, selected) => onSelect(option, selected, "createdAt")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.createdAt}
    />,
    <Dropdown
      key="deadline"
      options={["asc", "desc"]}
      placeholder="Deadline"
      onSelect={(option, selected) => onSelect(option, selected, "deadline")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.deadline}
    />,
    <Dropdown
      key="updatedAt"
      options={["asc", "desc"]}
      placeholder="Updated At"
      onSelect={(option, selected) => onSelect(option, selected, "updatedAt")}
      multipleSelect={false}
      horizontal={true}
      defaultSelected={filters.updatedAt}
    />,
  ];
  return (
    <>
      <Navbar isLoggedIn={userInfo?.id ? true : false} />
      <div className="m-auto lg:w-8/12  w-full p-4  ">
        <h1 className="mt-16"> Make a difference </h1>
        <h2> Help charities innovate and make a lasting impact </h2>
        <div className="flex flex-row gap-4  border-b-2 border-b-baseSecondary p-4">
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
          <div className="bg-accentPrimary w-4/12 h-60 rounded-md">.</div>
        </div>
        <div className="flex flex-row gap-2 ">
          <div className="mt-2 flex items-center space-x-2">
            <DropdownCard
              dropdownList={filterOptions}
              dropdownToggle={filterOptionsToggle}
            />
            <DropdownCard
              dropdownList={sortOptions}
              dropdownToggle={sortOptionsToggle}
            />
            {showClearFilters && (
              <CancelButton
                text="Clear Filters"
                ariaLabel="clear filters"
                icon={<CloseIcon />}
                action={clearFilters}
              />
            )}
          </div>
        </div>
        <div className="flex flex-row gap-2 flex-wrap m-auto w-full justify-center">
          {fetcher.state === "loading" ? (
            <svg
              className="animate-spin h-5 w-5 mr-3 text-baseSecondary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="#836953"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="#836953"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
          ) : (
            <>
              {fetcher.data?.filteredTasks?.map((task) => (
                <TaskSummaryCard
                  key={task.id}
                  title={task.title}
                  category={task.category}
                  deadline={new Date(task.deadline)}
                  description={task.description}
                  volunteersNeeded={task?.volunteersNeeded}
                  urgency={task.urgency || "LOW"}
                  requiredSkills={task.requiredSkills}
                  status={task.status}
                  id={task.id}
                  impact={task.impact}
                  charityId={task.charity?.id || null}
                  deliverables={task.deliverables}
                  resources={task.resources}
                  userId={task.createdBy.id}
                  charityName={task.charity?.name || ""}
                  userName={task.createdBy?.name || ""}
                />
              ))}
            </>
          )}
        </div>
      </div>
      <div></div>
    </>
  );
}
