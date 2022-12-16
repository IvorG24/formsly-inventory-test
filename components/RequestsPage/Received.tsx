import { Search } from "@/components/Icon";
import {
  deleteRequest,
  retrieveRequestFormByTeam,
  retrieveRequestList,
} from "@/utils/queries";
import type { Database, RequestType } from "@/utils/types";
import {
  ActionIcon,
  Group,
  LoadingOverlay,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { ceil } from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "./RequestsPage.module.scss";
import RequestTable from "./RequestTable";

const statusOptions: {
  value: Database["public"]["Enums"]["request_status"];
  label: string;
}[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "revision", label: "Revision" },
  { value: "stale", label: "Stale" },
];

const REQUEST_PER_PAGE = 8;

const Received = () => {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [requestList, setRequestList] = useState<RequestType[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [requestCount, setRequestCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<RequestType | null>(
    null
  );
  const [isApprover, setIsApprover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<{ value: string; label: string }[]>([]);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  const fetchRequests = async (isSearch: boolean) => {
    try {
      setSelectedRequest(null);
      setIsLoading(true);
      const start = (activePage - 1) * REQUEST_PER_PAGE;

      const { requestList, requestCount } = await retrieveRequestList(
        supabase,
        start,
        `${router.query.tid}`,
        REQUEST_PER_PAGE,
        selectedForm,
        status,
        search,
        isSearch,
        "received",
        `${user?.id}`
      );

      setRequestList(requestList);
      setRequestCount(Number(requestCount));

      setIsLoading(false);
    } catch {
      showNotification({
        title: "Error!",
        message: "Failed to fetch Request List",
        color: "red",
      });
    }
  };

  const fetchForms = async () => {
    try {
      const requestFormList = await retrieveRequestFormByTeam(
        supabase,
        `${router.query.tid}`
      );
      const forms = requestFormList?.map((form) => {
        return { value: `${form.form_id}`, label: `${form.form_name}` };
      });
      setForms(forms);
    } catch {
      showNotification({
        title: "Error!",
        message: "Failed to fetch Form List",
        color: "red",
      });
    }
  };
  // first load
  useEffect(() => {
    fetchRequests(false);
    fetchForms();
  }, [supabase]);

  // filter
  useEffect(() => {
    setActivePage(1);
    fetchRequests(false);
  }, [selectedForm, status]);

  // change page
  useEffect(() => {
    fetchRequests(false);
  }, [activePage]);

  useEffect(() => {
    setIsApprover(false);
    if (selectedRequest) {
      if (
        (selectedRequest.request_status === "stale" ||
          selectedRequest.request_status === "pending") &&
        selectedRequest.approver_id === user?.id
      ) {
        setIsApprover(true);
      }
    }
  }, [selectedRequest, user]);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("request_table")
        .update({ request_status: "approved" })
        .eq("request_id", Number(selectedRequest?.request_id));

      if (error) throw error;

      setRequestList((prev) =>
        prev.map((request) => {
          if (request.request_id === selectedRequest?.request_id) {
            return {
              ...request,
              request_status: "approved",
            };
          } else {
            return request;
          }
        })
      );
      setSelectedRequest(null);
      showNotification({
        title: "Success!",
        message: `You approved ${selectedRequest?.request_title}`,
        color: "green",
      });
    } catch {
      showNotification({
        title: "Error!",
        message: `Failed to approve ${selectedRequest?.request_title}`,
        color: "red",
      });
    }
    setIsLoading(false);
  };

  // const handleSendToRevision = async () => {
  //   setIsLoading(true);
  //   try {
  //     const { error } = await supabase
  //       .from("request_table")
  //       .update({ request_status: "revision" })
  //       .eq("request_id", Number(selectedRequest?.request_id));

  //     if (error) throw error;

  //     setRequestList((prev) =>
  //       prev.map((request) => {
  //         if (request.request_id === selectedRequest?.request_id) {
  //           return {
  //             ...request,
  //             request_status: "revision",
  //           };
  //         } else {
  //           return request;
  //         }
  //       })
  //     );
  //     setSelectedRequest(null);
  //     showNotification({
  //       title: "Success!",
  //       message: `${selectedRequest?.request_title} is sent to revision`,
  //       color: "green",
  //     });
  //   } catch {
  //     showNotification({
  //       title: "Error!",
  //       message: `${selectedRequest?.request_title} has failed to send to revision `,
  //       color: "red",
  //     });
  //   }
  //   setIsLoading(false);
  // };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("request_table")
        .update({ request_status: "rejected" })
        .eq("request_id", Number(selectedRequest?.request_id));

      if (error) throw error;

      setRequestList((prev) =>
        prev.map((request) => {
          if (request.request_id === selectedRequest?.request_id) {
            return {
              ...request,
              request_status: "rejected",
            };
          } else {
            return request;
          }
        })
      );
      setSelectedRequest(null);
      showNotification({
        title: "Success!",
        message: `You rejected ${selectedRequest?.request_title}`,
        color: "green",
      });
    } catch {
      showNotification({
        title: "Error!",
        message: `Failed to reject ${selectedRequest?.request_title}`,
        color: "red",
      });
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteRequest(supabase, Number(selectedRequest?.request_id));

      setRequestList((prev) =>
        prev.filter(
          (request) => request.request_id !== selectedRequest?.request_id
        )
      );
      setSelectedRequest(null);
      showNotification({
        title: "Success!",
        message: `You deleted ${selectedRequest?.request_title}`,
        color: "green",
      });
    } catch {
      showNotification({
        title: "Error!",
        message: `Failed to delete ${selectedRequest?.request_title}`,
        color: "red",
      });
    }
    setIsLoading(false);
  };

  const confirmationModal = (
    action: string,
    requestTitle: string,
    confirmFunction: () => void
  ) =>
    openConfirmModal({
      title: "Please confirm your action",
      children: (
        <Text size="sm">
          Are you sure you want to {action} the {requestTitle}?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onConfirm: () => confirmFunction(),
    });

  // todo: add eslint to show error for `mt={"xl"}`
  return (
    <Stack>
      <LoadingOverlay visible={isLoading} overlayBlur={2} />
      <Group mt="xl">
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          rightSection={
            <ActionIcon onClick={() => fetchRequests(true)}>
              <Search />
            </ActionIcon>
          }
        />
        <Select
          clearable
          placeholder="Form Type"
          data={forms}
          value={selectedForm}
          onChange={setSelectedForm}
        />
        <Select
          clearable
          placeholder="Status"
          data={statusOptions}
          value={status}
          onChange={setStatus}
        />
      </Group>
      <RequestTable
        requestList={requestList}
        selectedRequest={selectedRequest}
        setSelectedRequest={setSelectedRequest}
        isApprover={isApprover}
        handleApprove={handleApprove}
        // handleSendToRevision={handleSendToRevision}
        handleReject={handleReject}
        handleDelete={handleDelete}
        confirmationModal={confirmationModal}
      />
      {requestCount / REQUEST_PER_PAGE > 1 ? (
        <Pagination
          className={styles.pagination}
          page={activePage}
          onChange={setActivePage}
          total={ceil(requestCount / REQUEST_PER_PAGE)}
        />
      ) : null}
    </Stack>
  );
};

export default Received;
