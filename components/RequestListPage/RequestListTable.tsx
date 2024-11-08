import { getFieldResponseByRequestId } from "@/backend/api/get";
import { updateRequestOtpId } from "@/backend/api/update";
import { useFormList } from "@/stores/useFormStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import {
  BASE_URL,
  DEFAULT_REQUEST_LIST_LIMIT,
  formatDate,
} from "@/utils/constant";
import { safeParse } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  getAvatarColor,
  getJiraTicketStatusColor,
  getStatusToColor,
} from "@/utils/styling";
import {
  RequestListFilterValues,
  RequestListItemSignerType,
  RequestListItemType,
  requestSignerType,
  TeamMemberWithUserType,
} from "@/utils/types";
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  CopyButton,
  createStyles,
  Flex,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconArrowsMaximize, IconCopy } from "@tabler/icons-react";
import { DataTableSortStatus } from "mantine-datatable";
import router from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import ListTable from "../ListTable/ListTable";
import RequestSignerList from "./RequestSignerList";

type Props = {
  requestList: RequestListItemType[];
  requestListCount: number;
  teamMemberList: TeamMemberWithUserType[];
  activePage: number;
  isFetchingRequestList: boolean;
  selectedFormFilter: string[] | undefined;
  handlePagination: (p: number) => void;
  sortStatus: DataTableSortStatus;
  setSortStatus: Dispatch<SetStateAction<DataTableSortStatus>>;
  setValue: UseFormSetValue<RequestListFilterValues>;
  checkIfColumnIsHidden: (column: string) => boolean;
  showTableColumnFilter: boolean;
  setShowTableColumnFilter: Dispatch<SetStateAction<boolean>>;
  listTableColumnFilter: string[];
  setListTableColumnFilter: (
    val: string[] | ((prevState: string[]) => string[])
  ) => void;
  tableColumnList: { value: string; label: string }[];
};

const useStyles = createStyles(() => ({
  requestor: {
    border: "solid 2px white",
    cursor: "pointer",
  },
  clickable: {
    cursor: "pointer",
  },
}));

const defaultAvatarProps = { color: "blue", size: "sm", radius: "xl" };

const RequestListTable = ({
  requestList,
  requestListCount,
  teamMemberList,
  activePage,
  isFetchingRequestList,
  handlePagination,
  selectedFormFilter,
  sortStatus,
  setSortStatus,
  setValue,
  checkIfColumnIsHidden,
  showTableColumnFilter,
  setShowTableColumnFilter,
  listTableColumnFilter,
  setListTableColumnFilter,
  tableColumnList,
}: Props) => {
  const { classes } = useStyles();
  const activeTeam = useActiveTeam();
  const formList = useFormList();
  const supabaseClient = createPagesBrowserClient();
  const userTeamMember = useUserTeamMember();

  const [jiraTicketStatusList, setJiraTicketStatusList] = useState<
    { jira_id: string; status: string }[]
  >([]);

  const [isFetchingJiraStatus, setIsFetchingJiraStatus] = useState<string[]>(
    []
  );

  const [isFetchingOtpId, setIsFetchingOtpId] = useState<string[]>([]);
  const [otpIdList, setOtpIdList] = useState<
    { formslyId: string; otpId: string }[]
  >([]);

  const [pedEquipmentNumberList, setPedEquipmentNumberList] = useState<
    { request_id: string; equipment_number: string[] }[]
  >([]);

  const [
    isFetchingPedEquipmentNumberList,
    setIsFetchingPedEquipmentNumberList,
  ] = useState(false);

  const selectedFormList = selectedFormFilter
    ? formList.filter((form) => selectedFormFilter.includes(form.form_id))
    : undefined;
  const isPEDForm = selectedFormList
    ? selectedFormList.some((form) => form.form_name.includes("PED"))
    : undefined;

  const getPedRequestTypeId = (formName: string) => {
    switch (formName) {
      case "PED Item":
        return "20d9159a-c410-4e4b-8c21-c02e44d8f1e9";
      case "PED Part":
        return "fec1de43-c4bc-4c0d-9f6d-41f8146b14a5";
      default:
        return "";
    }
  };

  const getPedEquipmentNumberFieldId = (formName: string) => {
    switch (formName) {
      case "PED Item":
        return "53df2b33-9d35-4a15-b13d-431940738c68";
      case "PED Part":
        return "e35835b4-c107-4710-86d5-11b6059e221c";

      default:
        return "";
    }
  };

  const handleFetchJiraTicketStatus = async (jiraTicketKey: string) => {
    try {
      setIsFetchingJiraStatus((prev) => [...prev, jiraTicketKey]);
      let jiraStatus = { jira_id: "", status: "" };
      const requestJiraTicketData = await fetch(
        `/api/jira/get-ticket?jiraTicketKey=${jiraTicketKey}`
      );
      if (!requestJiraTicketData.ok) {
        jiraStatus = {
          jira_id: jiraTicketKey,
          status: "Ticket Not Found",
        };
      } else {
        const jiraTicket = await requestJiraTicketData.json();
        const jiraTicketStatus =
          jiraTicket.fields["customfield_10010"].currentStatus.status;
        jiraStatus = {
          jira_id: jiraTicketKey,
          status: jiraTicketStatus,
        };
      }

      const isAlreadyFetched = jiraTicketStatusList.find(
        (ticket) => ticket.jira_id === jiraTicketKey
      );
      let updatedJiraTicketStatusList = jiraTicketStatusList;

      if (isAlreadyFetched) {
        updatedJiraTicketStatusList = jiraTicketStatusList.map((ticket) => {
          if (ticket.jira_id === jiraTicketKey) {
            return jiraStatus;
          } else {
            return ticket;
          }
        });
      } else {
        updatedJiraTicketStatusList.push(jiraStatus);
      }

      setJiraTicketStatusList(updatedJiraTicketStatusList);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch jira status",
        color: "red",
      });
    } finally {
      const updatedFetchingJiraStatus = isFetchingJiraStatus.filter(
        (ticket) => ticket === jiraTicketKey
      );
      setIsFetchingJiraStatus(updatedFetchingJiraStatus);
    }
  };

  const handleFetchOtpId = async (jiraTicketKey: string, formslyId: string) => {
    try {
      setIsFetchingOtpId((prev) => [...prev, formslyId]);
      const requestJiraTicketData = await fetch(
        `/api/jira/get-ticket?jiraTicketKey=${jiraTicketKey}`
      );

      if (!requestJiraTicketData.ok)
        throw new Error("Failed to fetch jira ticket");

      const jiraTicket = await requestJiraTicketData.json();

      if (!jiraTicket.fields["customfield_10172"]) {
        notifications.show({
          message: "This request doesn't have an OTP ID",
          color: "orange",
        });
        return;
      }
      const jiraTicketOtpId = jiraTicket.fields["customfield_10172"];

      await updateRequestOtpId(supabaseClient, {
        formslyId,
        otpId: jiraTicketOtpId,
      });

      const isAlreadyFetched = otpIdList.find(
        (otp) => otp.formslyId === formslyId
      );

      let updatedOtpIdList = otpIdList;
      if (isAlreadyFetched) {
        updatedOtpIdList = otpIdList.map((otp) => {
          if (otp.formslyId === formslyId) {
            return { ...otp, otpId: jiraTicketOtpId };
          }
          return otp;
        });
      } else {
        updatedOtpIdList.push({ formslyId, otpId: jiraTicketOtpId });
      }
      setOtpIdList(updatedOtpIdList);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch OTP Id",
        color: "red",
      });
    } finally {
      const updatedFetchingOtpId = isFetchingOtpId.filter(
        (otpFormslyId) => otpFormslyId === formslyId
      );
      setIsFetchingOtpId(updatedFetchingOtpId);
    }
  };

  useEffect(() => {
    const fetchPedEquipmentNumberList = async (
      requestList: RequestListItemType[]
    ) => {
      try {
        if (!selectedFormFilter || requestList.length <= 0) return;
        const requestListIsAlreadyFetched = pedEquipmentNumberList.find(
          (ped) => ped.request_id === requestList[0].request_id
        );
        // does not fetch if filter is not ped
        // does not fetch if request list has been fetched
        if (!selectedFormList || !isPEDForm || requestListIsAlreadyFetched)
          return;

        const requestTypeIdList = selectedFormList.map((form) => ({
          formId: form.form_id,
          requestTypeId: getPedRequestTypeId(form.form_name),
        }));

        const pedEquipmentFieldIdList = selectedFormList.map((form) => ({
          formId: form.form_id,
          requestTypeId: getPedEquipmentNumberFieldId(form.form_name),
        }));

        const currentPedEquipmentNumberList = pedEquipmentNumberList;
        setIsFetchingPedEquipmentNumberList(true);
        const newPedEquipmentNumberList = await Promise.all(
          requestList.map(async (request) => {
            const requestType = requestTypeIdList.find(
              (id) => request.request_form_id === id.formId
            );
            const pedEquipmentField = pedEquipmentFieldIdList.find(
              (id) => request.request_form_id === id.formId
            );

            let pedEquipmentNumber = {
              request_id: request.request_id,
              equipment_number: ["N/A"],
            };

            if (
              !requestType?.requestTypeId ||
              !pedEquipmentField?.requestTypeId
            ) {
              return pedEquipmentNumber;
            }

            const requestTypeResponse = await getFieldResponseByRequestId(
              supabaseClient,
              {
                requestId: request.request_id,
                fieldId: requestType.requestTypeId,
              }
            );

            const isRequestTypeBulk =
              requestTypeResponse[0] &&
              safeParse(
                requestTypeResponse[0].request_response
              ).toLowerCase() === "bulk";

            if (isRequestTypeBulk) {
              pedEquipmentNumber = {
                request_id: request.request_id,
                equipment_number: ["Bulk"],
              };
            } else {
              const equipmentNumberList = await getFieldResponseByRequestId(
                supabaseClient,
                {
                  requestId: request.request_id,
                  fieldId: pedEquipmentField.requestTypeId,
                }
              );

              const equipmentNumberListResponse: string[] =
                equipmentNumberList.map((equipment) =>
                  safeParse(equipment.request_response)
                );

              pedEquipmentNumber = {
                request_id: request.request_id,
                equipment_number: equipmentNumberList
                  ? equipmentNumberListResponse
                  : ["N/A"],
              };
            }

            return pedEquipmentNumber;
          })
        );

        const updatedPedEquipmentNumberList = [
          ...currentPedEquipmentNumberList,
          ...newPedEquipmentNumberList,
        ];
        setPedEquipmentNumberList(updatedPedEquipmentNumberList);
      } catch (e) {
      } finally {
        setIsFetchingPedEquipmentNumberList(false);
      }
    };

    fetchPedEquipmentNumberList(requestList);
  }, [
    isPEDForm,
    pedEquipmentNumberList,
    requestList,
    selectedFormList,
    selectedFormFilter,
  ]);

  useEffect(() => {
    const currentOtpIdList = requestList.map((request) => ({
      formslyId: request.request_formsly_id,
      otpId: request.request_otp_id ?? "",
    }));
    setOtpIdList(currentOtpIdList);
  }, [requestList]);

  useEffect(() => {
    setValue("isAscendingSort", sortStatus.direction === "asc" ? true : false);
    handlePagination(activePage);
  }, [sortStatus]);

  return (
    <ListTable
      idAccessor="request_id"
      records={requestList}
      fetching={isFetchingRequestList}
      page={activePage}
      onPageChange={(page) => {
        handlePagination(page);
      }}
      totalRecords={requestListCount}
      recordsPerPage={DEFAULT_REQUEST_LIST_LIMIT}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      columns={[
        {
          accessor: "request_id",
          title: "Request ID",
          width: 180,
          hidden: checkIfColumnIsHidden("request_id"),
          render: ({ request_id, request_formsly_id }) => {
            const requestId =
              request_formsly_id === "-" ? request_id : request_formsly_id;

            return (
              <Flex key={String(requestId)} justify="space-between">
                <Text truncate maw={150}>
                  <Anchor
                    href={`/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/requests/${requestId}`}
                    target="_blank"
                  >
                    {String(requestId)}
                  </Anchor>
                </Text>
                <CopyButton
                  value={`${BASE_URL}/${formatTeamNameToUrlKey(
                    activeTeam.team_name ?? ""
                  )}/requests/${requestId}`}
                >
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "Copied" : `Copy ${requestId}`}
                      onClick={copy}
                    >
                      <ActionIcon>
                        <IconCopy size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Flex>
            );
          },
        },
        {
          accessor: "request_jira_id",
          title: "JIRA ID",
          hidden: checkIfColumnIsHidden("request_jira_id"),
          render: ({ request_jira_id, request_jira_link }) => {
            if (request_jira_id === null) {
              return null;
            }

            return (
              <Flex justify="space-between" key={String(request_jira_id)}>
                <Text>
                  <Anchor href={String(request_jira_link)} target="_blank">
                    {String(request_jira_id)}
                  </Anchor>
                </Text>
                {String(request_jira_id) && (
                  <CopyButton value={String(request_jira_id)}>
                    {({ copied, copy }) => (
                      <Tooltip
                        label={copied ? "Copied" : `Copy ${request_jira_id}`}
                        onClick={copy}
                      >
                        <ActionIcon>
                          <IconCopy size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                )}
              </Flex>
            );
          },
        },
        {
          accessor: "request_id_status",
          title: "JIRA Status",
          hidden: checkIfColumnIsHidden("request_jira_status"),
          render: ({ request_jira_id }) => {
            if (request_jira_id === null) {
              return null;
            }

            const jiraStatusMatch = jiraTicketStatusList.find(
              (status) => status.jira_id === request_jira_id
            );

            const isBeingFetched = isFetchingJiraStatus.includes(
              `${request_jira_id}`
            );

            const badgeColor = jiraStatusMatch
              ? getJiraTicketStatusColor(
                  `${jiraStatusMatch.status.toLowerCase()}`
                )
              : "blue";

            return (
              <Tooltip
                disabled={!Boolean(jiraStatusMatch)}
                label={jiraStatusMatch && jiraStatusMatch.status}
              >
                <Flex justify="center">
                  <Box maw={120} sx={{ cursor: "pointer" }}>
                    {String(request_jira_id) && (
                      <Badge
                        w={120}
                        key={String(request_jira_id)}
                        variant={jiraStatusMatch ? "light" : "filled"}
                        color={badgeColor}
                        onClick={() =>
                          handleFetchJiraTicketStatus(String(request_jira_id))
                        }
                      >
                        {isBeingFetched ? (
                          <Loader
                            color={jiraStatusMatch ? "blue" : "white"}
                            variant="dots"
                            size={24}
                          />
                        ) : jiraStatusMatch ? (
                          jiraStatusMatch.status
                        ) : (
                          "Show Status"
                        )}
                      </Badge>
                    )}
                  </Box>
                </Flex>
              </Tooltip>
            );
          },
        },
        {
          accessor: "request_otp_id",
          title: "OTP ID",
          hidden: checkIfColumnIsHidden("request_otp_id"),
          render: ({
            request_otp_id,
            request_team_member_id,
            request_jira_id,
            request_formsly_id,
          }) => {
            const canUserFetchOtpId =
              userTeamMember &&
              (userTeamMember.team_member_id === request_team_member_id ||
                ["OWNER", "APPROVER"].includes(
                  userTeamMember.team_member_role
                ));
            const currentOtp = otpIdList.find(
              (otp) => otp.formslyId === request_formsly_id
            );

            const isBeingFetched = isFetchingOtpId.includes(
              `${request_formsly_id}`
            );

            return (
              <>
                {request_jira_id && (
                  <Flex maw={120} justify="space-between">
                    {!request_otp_id &&
                    canUserFetchOtpId &&
                    !currentOtp?.otpId ? (
                      <Badge
                        w={120}
                        sx={{ cursor: "pointer" }}
                        onClick={() =>
                          handleFetchOtpId(
                            `${request_jira_id}`,
                            String(request_formsly_id)
                          )
                        }
                      >
                        {isBeingFetched ? (
                          <Loader
                            color={currentOtp ? "blue" : "white"}
                            variant="dots"
                            size={24}
                          />
                        ) : (
                          "Get OTP"
                        )}
                      </Badge>
                    ) : (
                      <>
                        <Text truncate w={90}>
                          {currentOtp?.otpId}
                        </Text>
                        {currentOtp?.otpId && (
                          <CopyButton value={currentOtp?.otpId as string}>
                            {({ copied, copy }) => (
                              <Tooltip
                                label={
                                  copied
                                    ? "Copied"
                                    : `Copy ${currentOtp?.otpId}`
                                }
                                onClick={copy}
                              >
                                <ActionIcon>
                                  <IconCopy size={16} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                        )}
                      </>
                    )}
                  </Flex>
                )}
              </>
            );
          },
        },
        {
          accessor: "form_name",
          title: "Form Name",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_form_name"),
          render: ({ form_name }) => {
            return (
              <Text truncate maw={150}>
                {String(form_name)}
              </Text>
            );
          },
        },
        {
          accessor: "request_ped_equipment_number",
          title: "PED Equipment Number",
          hidden:
            !isPEDForm || checkIfColumnIsHidden("request_ped_equipment_number"),
          render: ({ request_id }) => {
            const pedEquipmentNumberMatch = pedEquipmentNumberList.find(
              (ped) => ped.request_id === request_id
            );
            const shouldTruncate =
              pedEquipmentNumberMatch &&
              pedEquipmentNumberMatch.equipment_number.length >= 3;

            const renderEquipmentNumbers = () => {
              if (!pedEquipmentNumberMatch) return null;

              if (shouldTruncate) {
                return (
                  <Group>
                    <Text maw={80} truncate>
                      {pedEquipmentNumberMatch.equipment_number.join(", ")}
                    </Text>
                    <Menu shadow="md" withArrow withinPortal={true}>
                      <Menu.Target>
                        <UnstyledButton>
                          <Text color="blue">Show All</Text>
                        </UnstyledButton>
                      </Menu.Target>
                      <Menu.Dropdown p="md">
                        <Stack spacing={8}>
                          {pedEquipmentNumberMatch.equipment_number.map(
                            (equipment, idx) => (
                              <Text key={equipment + idx}>{equipment}</Text>
                            )
                          )}
                        </Stack>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                );
              }

              return (
                <Text>
                  {pedEquipmentNumberMatch.equipment_number.join(", ")}
                </Text>
              );
            };

            return (
              <Box>
                {isFetchingPedEquipmentNumberList ? (
                  <Loader size={16} />
                ) : (
                  renderEquipmentNumbers()
                )}
              </Box>
            );
          },
        },

        {
          accessor: "request_status",
          title: "Formsly Status",
          sortable: true,
          hidden: checkIfColumnIsHidden("request_status"),
          render: ({ request_status }) => (
            <Flex justify="center">
              <Badge
                variant="filled"
                color={getStatusToColor(String(request_status))}
              >
                {String(request_status)}
              </Badge>
            </Flex>
          ),
        },
        {
          accessor: "user_id",
          title: "Requested By",
          hidden: checkIfColumnIsHidden("request_team_member_id"),
          render: ({ request_team_member_id }) => {
            const requestorMemberData = teamMemberList.find(
              (member) => member.team_member_id === request_team_member_id
            );

            if (!requestorMemberData) {
              return <Text>Public User</Text>;
            }

            const {
              team_member_user: { user_id, user_first_name, user_last_name },
            } = requestorMemberData;

            return (
              <Flex px={0} gap={8} align="center">
                <Avatar
                  // src={requestor.user_avatar}
                  {...defaultAvatarProps}
                  color={
                    user_id
                      ? getAvatarColor(Number(`${user_id.charCodeAt(0)}`))
                      : undefined
                  }
                  className={classes.requestor}
                  onClick={() =>
                    request_team_member_id
                      ? window.open(`/member/${request_team_member_id}`)
                      : null
                  }
                >
                  {user_id ? `${user_first_name[0] + user_last_name[0]}` : ""}
                </Avatar>
                {user_id && (
                  <Anchor
                    href={`/member/${request_team_member_id}`}
                    target="_blank"
                  >
                    <Text>{`${user_first_name} ${user_last_name}`}</Text>
                  </Anchor>
                )}
              </Flex>
            );
          },
        },
        {
          accessor: "request_signer",
          title: "Approver",
          hidden: checkIfColumnIsHidden("request_signer"),
          render: (request) => {
            const { request_signer } = request as {
              request_signer: requestSignerType[];
            };
            if (!teamMemberList || teamMemberList.length === 0) {
              return;
            }
            const signerList = request_signer.map(
              (signer: requestSignerType) => {
                const signerTeamMemberData = teamMemberList.find(
                  (member) =>
                    member.team_member_id ===
                    signer.request_signer.signer_team_member_id
                );

                return {
                  ...signer,
                  signer_team_member_user:
                    signerTeamMemberData?.team_member_user,
                };
              }
            );

            return (
              <>
                {signerList[0].signer_team_member_user?.user_id && (
                  <RequestSignerList
                    signerList={signerList as RequestListItemSignerType[]}
                  />
                )}
              </>
            );
          },
        },

        {
          accessor: "request_date_created",
          title: "Date Created",
          hidden: checkIfColumnIsHidden("request_date_created"),
          sortable: true,
          render: ({ request_date_created }) => (
            <Text>{formatDate(new Date(String(request_date_created)))}</Text>
          ),
        },
        {
          accessor: "view",
          title: "View",
          hidden: checkIfColumnIsHidden("view"),
          textAlignment: "center",
          render: ({ request_id, request_formsly_id }) => {
            const requestId =
              request_formsly_id === "-" ? request_id : request_formsly_id;
            return (
              <ActionIcon
                maw={120}
                mx="auto"
                color="blue"
                onClick={async () =>
                  await router.push(
                    `/${formatTeamNameToUrlKey(
                      activeTeam.team_name ?? ""
                    )}/requests/${requestId}`
                  )
                }
              >
                <IconArrowsMaximize size={16} />
              </ActionIcon>
            );
          },
        },
      ]}
      showTableColumnFilter={showTableColumnFilter}
      setShowTableColumnFilter={setShowTableColumnFilter}
      listTableColumnFilter={listTableColumnFilter}
      setListTableColumnFilter={setListTableColumnFilter}
      tableColumnList={tableColumnList}
    />
  );
};

export default RequestListTable;
