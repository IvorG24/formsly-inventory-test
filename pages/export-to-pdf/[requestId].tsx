"use client";

import {
  getExistingConnectedRequest,
  getRequest,
  getUserCurrentSignature,
  getUserSignatureList,
} from "@/backend/api/get";
import ExportToPdf from "@/components/ExportToPDF/ExportToPdf";
import Meta from "@/components/Meta/Meta";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import { Database } from "@/utils/database";
import { ApproverDetailsType, RequestWithResponseType } from "@/utils/types";
import { notifications } from "@mantine/notifications";
import {
  createPagesBrowserClient,
  createPagesServerClient,
} from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabaseClient = createPagesServerClient(context);
  try {
    const data = await getRequest(supabaseClient, {
      request_id: context.query.requestId as string,
    });
    return {
      props: {
        request: data,
      },
    };
  } catch (e) {
    return {
      redirect: {
        destination: "/500",
        permanent: false,
      },
    };
  }
};

type Props = {
  request: RequestWithResponseType;
};

const Page = ({ request }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();

  const [approverDetails, setApproverDetails] = useState<ApproverDetailsType[]>(
    []
  );
  const [isFetchingApprover, setIsFetchingApprover] = useState(true);

  useEffect(() => {
    try {
      setIsFetchingApprover(true);
      const fetchApproverDetails = async () => {
        let approverData: ApproverDetailsType[] = [];
        let signerList = request.request_signer;
        const isLRF =
          request.request_form.form_name === "Liquidation Reimbursement";
        if (isLRF && request.request_status === "APPROVED") {
          const boqRequest = await getExistingConnectedRequest(supabaseClient, {
            parentRequestId: request.request_id,
            fieldId: "eff42959-8552-4d7e-836f-f89018293ae8",
          });

          if (boqRequest?.request_id) {
            const boqRequestData = await getRequest(supabaseClient, {
              request_id: boqRequest.request_id as string,
            });

            signerList = boqRequestData.request_signer;
          }
        }

        approverData = await Promise.all(
          signerList.map(async (signer) => {
            let signatureUrl: string | null = null;
            if (
              signer.request_signer_status === "APPROVED" &&
              signer.request_signer_signer.signer_team_member.team_member_user
                .user_signature_attachment_id
            ) {
              const signatureList = await getUserSignatureList(supabaseClient, {
                userId:
                  signer.request_signer_signer.signer_team_member
                    .team_member_user.user_id,
              });

              let defaultSignature = "";
              if (signatureList.length) {
                defaultSignature =
                  signatureList[signatureList.length - 1]
                    .signature_history_value;
              } else {
                defaultSignature = await getUserCurrentSignature(
                  supabaseClient,
                  {
                    userId:
                      signer.request_signer_signer.signer_team_member
                        .team_member_user.user_id,
                  }
                );
              }

              const signedDate = new Date(
                `${signer.request_signer_status_date_updated}`
              ).getTime();

              const signatureMatch = signatureList.find((signature, index) => {
                if (!signature) {
                  return false;
                }

                const nextSignatureDateCreatedTime =
                  index < signatureList.length - 1
                    ? new Date(
                        signatureList[index + 1].signature_history_date_created
                      ).getTime()
                    : 0;

                return signedDate < nextSignatureDateCreatedTime;
              });

              if (signatureMatch) {
                signatureUrl = signatureMatch.signature_history_value;
              } else {
                signatureUrl = defaultSignature;
              }
            }

            return {
              name: `${signer.request_signer_signer.signer_team_member.team_member_user.user_first_name} ${signer.request_signer_signer.signer_team_member.team_member_user.user_last_name}`,
              jobDescription:
                signer.request_signer_signer.signer_team_member.team_member_user
                  .user_job_title,
              status: signer.request_signer_status,
              date: signer.request_signer_status_date_updated,
              signature: signatureUrl,
            };
          })
        );

        setApproverDetails(approverData);
      };
      if (request) {
        fetchApproverDetails();
      }
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsFetchingApprover(false);
    }
  }, [request, supabaseClient]);

  const originalSectionList = request.request_form.form_section;
  const sectionWithDuplicateList =
    generateSectionWithDuplicateList(originalSectionList);

  return (
    <>
      <Meta description="Export to PDF" url="/" />
      {!isFetchingApprover && approverDetails.length !== 0 && (
        <ExportToPdf
          request={request}
          sectionWithDuplicateList={sectionWithDuplicateList}
          approverDetails={approverDetails}
        />
      )}
    </>
  );
};

export default Page;
