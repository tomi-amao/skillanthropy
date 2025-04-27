import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
  redirect,
  MetaFunction,
} from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useViewport } from "~/hooks/useViewport";
import { getSession } from "~/services/session.server";
import { getUserInfo } from "~/models/user2.server";
import {
  deleteCharity,
  getCharity,
  getCharityApplications,
  getCharityMemberships,
  listCharities,
  reviewCharityApplication,
  updateCharity,
} from "~/models/charities.server";
import { getSignedUrlForFile } from "~/services/s3.server";

// Import our components
import { CharityList } from "~/components/charities/CharityList";
import { CharityDetails } from "~/components/charities/CharityDetails";
import { ApplicationsList } from "~/components/charities/ApplicationsList";
import { ApplicationReviewModal } from "~/components/charities/ApplicationReviewModal";
import { MembersList } from "~/components/charities/MembersList";

// Import types
import {
  type Charity,
  type CharityApplication,
  type CharityMembership,
} from "~/types/charities";
import CharityForm from "~/components/charities/CharityForm";

export const meta: MetaFunction = () => {
  return [
    { title: "Manage Charities" },
    { name: "description", content: "Manage your charities on Skillanthropy!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  if (!accessToken) {
    return redirect("/zitlogin");
  }

  try {
    // Get user info and charity memberships in one call
    const { userInfo, charityMemberships } = await getUserInfo(accessToken);

    if (!userInfo?.id) {
      return redirect("/zitlogin");
    }

    const { id: userId, roles: userRole } = userInfo;

    // Extract user's charities from charity memberships
    const userCharities =
      charityMemberships?.memberships?.map((membership) => ({
        id: membership.charity.id,
        name: membership.charity.name,
        roles: membership.roles,
        permissions: membership.permissions,
      })) || [];

    // Get all charities where the user is an admin for admin functionality
    const adminCharities = userCharities
      .filter((charity) => charity.roles.includes("admin"))
      .map((charity) => ({
        id: charity.id,
        name: charity.name,
      }));

    console.log("Admin charities:", adminCharities);

    // Initialize collections
    let charitiesList = [];
    let pendingApplications = [];

    // Create an array of promises for parallel execution
    const promises = [];

    // If user is admin of any charities, fetch pending applications
    if (adminCharities.length > 0) {
      // Create promises for fetching applications for each charity
      const applicationPromises = adminCharities.map((charity) =>
        getCharityApplications({
          charityId: charity.id,
          status: "PENDING",
        }),
      );

      promises.push(
        Promise.all(applicationPromises).then((results) => {
          // Combine all applications into a single array
          pendingApplications = results
            .filter(
              (result) => result.applications && result.applications.length > 0,
            )
            .flatMap((result) => result.applications);
        }),
      );

      // Create promises for fetching details for admin charities only
      const charityPromises = adminCharities.map((charity) =>
        getCharity(charity.id, { charityMemberships: true }),
      );

      promises.push(
        Promise.all(charityPromises).then((results) => {
          // Collect all valid admin charities
          charitiesList = results
            .filter((result) => result.charity)
            .map((result) => result.charity);
        }),
      );
    }

    // Fetch all charity applications for the user
    promises.push(
      getCharityApplications({ userId }).catch((err) => {
        console.error("Error fetching user applications:", err);
        return { applications: [] };
      }),
    );

    // Wait for all promises to resolve
    const [, , userApplicationsResult] = await Promise.all(promises);

    return json({
      userInfo,
      userRole,
      userId,
      userCharities,
      adminCharities,
      charities: charitiesList,
      pendingApplications,
      userApplications: userApplicationsResult?.applications || [],
    });
  } catch (error) {
    console.error("Error in loader function:", error);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export default function ManageCharities() {
  const {
    userInfo,
    userRole,
    userId,
    userCharities,
    adminCharities,
    charities: initialCharities,
    pendingApplications,
    userApplications,
  } = useLoaderData<typeof loader>();

  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const { isMobile } = useViewport();
  const [searchParams] = useSearchParams();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCharityId, setSelectedCharityId] = useState<string | null>(
    () => {
      // Initialize with URL search param if it exists
      return searchParams.get("charityid") || null;
    },
  );
  const [isDetailsView, setIsDetailsView] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "applications" | "members" | "tasks"
  >("details");

  // Application review state
  const [selectedApplication, setSelectedApplication] =
    useState<CharityApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // State to store signed background URL
  const [signedBackgroundUrl, setSignedBackgroundUrl] = useState<
    string | undefined
  >(undefined);

  // State to store charity tasks
  const [charityTasks, setCharityTasks] = useState<any[]>([]);

  // State to store charity members
  const [charityMembers, setCharityMembers] = useState<CharityMembership[]>([]);

  // Handle URL updates
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const charityId = params.get("charityid");
    if (charityId) {
      setSelectedCharityId(charityId);
      navigate("/dashboard/charities", { replace: true });
    }
  }, [searchParams, navigate]);

  // Find selected charity from charities array
  const selectedCharity = useMemo(() => {
    return selectedCharityId
      ? initialCharities.find((charity) => charity.id === selectedCharityId)
      : null;
  }, [initialCharities, selectedCharityId]);

  // Fetch signed URL when selected charity changes
  useEffect(() => {
    async function fetchSignedUrl() {
      if (selectedCharity?.backgroundPicture) {
        try {
          const response = await fetch(
            `/api/s3-get-url?key=${encodeURIComponent(selectedCharity.backgroundPicture)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setSignedBackgroundUrl(data.url);
          } else {
            console.error("Failed to get signed URL");
            setSignedBackgroundUrl(undefined);
          }
        } catch (error) {
          console.error("Error fetching signed URL:", error);
          setSignedBackgroundUrl(undefined);
        }
      } else {
        setSignedBackgroundUrl(undefined);
      }
    }

    fetchSignedUrl();
  }, [selectedCharity]);

  // Fetch charity tasks when selected charity changes
  useEffect(() => {
    async function fetchCharityTasks() {
      if (selectedCharityId) {
        try {
          const response = await fetch(
            `/api/charities/${selectedCharityId}/tasks`,
          );
          if (response.ok) {
            const data = await response.json();
            setCharityTasks(data.tasks || []);
            console.log("Charity tasks:", data.tasks);
          } else {
            console.error("Failed to fetch charity tasks");
            setCharityTasks([]);
          }
        } catch (error) {
          console.error("Error fetching charity tasks:", error);
          setCharityTasks([]);
        }
      } else {
        setCharityTasks([]);
      }
    }

    fetchCharityTasks();
  }, [selectedCharityId]);

  // Fetch charity members when selected charity changes
  useEffect(() => {
    async function fetchCharityMembers() {
      if (selectedCharityId) {
        try {
          const response = await fetch(
            `/api/charities/${selectedCharityId}/members`,
          );
          if (response.ok) {
            const data = await response.json();
            setCharityMembers(data.members || []);
            console.log("Charity members:", data.members);
          } else {
            console.error("Failed to fetch charity members");
            setCharityMembers([]);
          }
        } catch (error) {
          console.error("Error fetching charity members:", error);
          setCharityMembers([]);
        }
      } else {
        setCharityMembers([]);
      }
    }

    fetchCharityMembers();
  }, [selectedCharityId]);

  // Filter applications for selected charity
  const filteredApplications = useMemo(() => {
    if (!selectedCharityId) return [];

    // Log for debugging
    console.log("All pending applications:", pendingApplications);
    console.log("Selected charity ID:", selectedCharityId);

    // Filter applications for the selected charity
    const filtered = pendingApplications.filter(
      (app) => app.charityId === selectedCharityId,
    );
    console.log("Filtered applications:", filtered);

    return filtered;
  }, [pendingApplications, selectedCharityId]);

  // Handle charity selection
  const handleCharitySelect = (charity: Charity) => {
    setSelectedCharityId(charity.id);
    setIsEditing(false);
    setActiveTab("details");
    if (isMobile) {
      setIsDetailsView(true);
    }
  };

  // Handle charity deletion
  const handleDeleteCharity = (charityId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this charity? This action cannot be undone.",
      )
    ) {
      fetcher.submit(
        { _action: "deleteCharity", charityId },
        { method: "POST" },
      );
      setSelectedCharityId(null);
    }
  };

  // Handle charity create/update
  const handleCharityFormSubmit = (formData: any) => {
    if (isEditing && selectedCharity) {
      // Update existing charity
      fetcher.submit(
        {
          _action: "updateCharity",
          charityId: selectedCharity.id,
          charityData: JSON.stringify(formData),
        },
        { method: "POST" },
      );
      setIsEditing(false);
    }
  };

  // Handle application review
  const handleReviewApplication = (applicationWithDecision: any) => {
    if (!applicationWithDecision.decision) return;

    fetcher.submit(
      {
        _action: "reviewApplication",
        applicationId: applicationWithDecision.id,
        status: applicationWithDecision.decision,
        reviewNote: applicationWithDecision.reviewNote || undefined,
      },
      { method: "POST" },
    );
  };

  // Handle review submission
  const handleSubmitReview = (
    decision: "ACCEPTED" | "REJECTED",
    reviewNote: string,
  ) => {
    if (!selectedApplication) return;

    fetcher.submit(
      {
        _action: "reviewApplication",
        applicationId: selectedApplication.id,
        status: decision,
        reviewNote: reviewNote || undefined,
      },
      { method: "POST" },
    );

    setShowApplicationModal(false);
  };

  // Check if user is admin of selected charity
  const isAdminOfSelectedCharity = useMemo(() => {
    // Find if the user is in the adminCharities list for the selected charity
    return selectedCharityId
      ? adminCharities.some((charity) => charity.id === selectedCharityId)
      : false;
  }, [selectedCharityId, adminCharities]);

  return (
    <div className="flex flex-col lg:flex-row w-full  lg:min-h-screen p-4 -mt-8 gap-6">
      <AnimatePresence mode="wait">
        {!isDetailsView && (
          <motion.div
            className="lg:w-1/3 w-full p-4  space-y-4 rounded-md border border-basePrimaryDark overflow-auto "
            initial={{ opacity: 0, x: isMobile ? -40 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            key="charity-list"
          >
            <CharityList
              charities={initialCharities}
              selectedCharityId={selectedCharityId}
              onCharitySelect={handleCharitySelect}
              adminCharities={adminCharities}
              pendingApplications={pendingApplications}
              userApplications={userApplications}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          className="lg:w-2/3 w-full pt-4 lg:pt-0 lg:pl-6 flex flex-col"
          initial={{ opacity: 0, x: isMobile ? 40 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          key={isDetailsView ? "charity-detail-view" : "charity-detail-default"}
        >
          {isDetailsView && isMobile && (
            <motion.button
              className="flex items-center space-x-2 text-baseSecondary mb-4 p-2 hover:bg-basePrimaryLight rounded-lg transition-colors"
              onClick={() => setIsDetailsView(false)}
              aria-label="Go back to charity list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={20} />
              <span>Back to charities</span>
            </motion.button>
          )}

          {selectedCharity ? (
            isEditing ? (
              <div className="flex flex-col h-full lg:max-w-7xl w-full m-auto">
                <CharityForm
                  onSubmit={handleCharityFormSubmit}
                  onCancel={() => setIsEditing(false)}
                  initialData={selectedCharity}
                  isSubmitting={fetcher.state === "submitting"}
                  isEditing={true}
                />
              </div>
            ) : (
              <div className="flex flex-col h-full lg:max-w-7xl w-full m-auto">
                <div className="flex-shrink-0">
                  <CharityDetails
                    charity={selectedCharity}
                    isAdmin={isAdminOfSelectedCharity}
                    onEdit={() => setIsEditing(true)}
                    onDelete={handleDeleteCharity}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    pendingApplicationsCount={filteredApplications.length}
                    signedBackgroundUrl={signedBackgroundUrl}
                    charityTasks={charityTasks}
                    onTaskSelect={(task) => {
                      // Handle task selection
                      navigate(`/dashboard/tasks?taskid=${task.id}`);
                    }}
                  />
                </div>

                {/* Conditionally render tab content outside the CharityDetails component */}
                {activeTab === "applications" && isAdminOfSelectedCharity && (
                  <div className=" bg-basePrimaryLight rounded-xl shadow-sm overflow-hidden flex-grow">
                    <div className="p-6">
                      <ApplicationsList
                        applications={filteredApplications}
                        onReviewApplication={handleReviewApplication}
                        isSubmitting={fetcher.state === "submitting"}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "members" && (
                  <div className=" bg-basePrimaryLight rounded-xl shadow-sm overflow-hidden flex-grow">
                    <MembersList
                      members={charityMembers}
                      isAdmin={isAdminOfSelectedCharity}
                    />
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-baseSecondary p-8  rounded-xl">
              {initialCharities.length > 0 ? (
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-2">
                    Select a charity to view details
                  </h3>
                  <p className="text-baseSecondary/70">
                    Choose a charity from the list to see its details
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-2">
                    No charities found
                  </h3>
                  <p className="text-baseSecondary/70 mb-4">
                    {adminCharities.length > 0
                      ? "Create a new charity to get started"
                      : "Join a charity to see it in this list"}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Application Review Modal */}
      <ApplicationReviewModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        selectedApplication={selectedApplication}
        onSubmitReview={handleSubmitReview}
        isSubmitting={fetcher.state === "submitting"}
      />
    </div>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken");

  if (!accessToken) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userInfo } = await getUserInfo(accessToken);

  if (!userInfo?.id) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const actionType = formData.get("_action")?.toString();

  try {
    switch (actionType) {
      case "updateCharity": {
        const charityId = formData.get("charityId")?.toString();
        const charityDataStr = formData.get("charityData")?.toString();

        if (!charityId || !charityDataStr) {
          return json(
            { error: "Charity ID and data are required" },
            { status: 400 },
          );
        }

        const charityData = JSON.parse(charityDataStr);
        const result = await updateCharity(charityId, charityData);

        if (result.status !== 200) {
          return json({ error: result.message }, { status: result.status });
        }

        return json({ success: true, charity: result.charity });
      }

      case "deleteCharity": {
        const charityId = formData.get("charityId")?.toString();

        if (!charityId) {
          return json({ error: "Charity ID is required" }, { status: 400 });
        }

        const result = await deleteCharity(charityId);

        if (result.status !== 200) {
          return json({ error: result.message }, { status: result.status });
        }

        return json({ success: true });
      }

      case "reviewApplication": {
        const applicationId = formData.get("applicationId")?.toString();
        const status = formData.get("status")?.toString();
        const reviewNote = formData.get("reviewNote")?.toString();

        if (!applicationId || !status) {
          return json(
            { error: "Application ID and status are required" },
            { status: 400 },
          );
        }

        if (status !== "ACCEPTED" && status !== "REJECTED") {
          return json({ error: "Invalid status" }, { status: 400 });
        }

        const result = await reviewCharityApplication(
          applicationId,
          userInfo.id,
          {
            status: status as any,
            reviewNote: reviewNote || undefined,
          },
        );

        if (result.status !== 200) {
          return json({ error: result.message }, { status: result.status });
        }

        return json({ success: true, application: result.application });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Action error:", error);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
