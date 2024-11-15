import { RequestSignerType } from "@/components/RequestPage/RequestSignerSection";
import { Database } from "@/utils/database";
import { RequestProjectSignerStatusType } from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const useRealtimeProjectRequestSignerList = (
  supabaseClient: SupabaseClient<Database>,
  params: {
    requestId: string;
    initialRequestProjectSignerList: RequestProjectSignerStatusType;
    requestSignerList: RequestSignerType[];
  }
) => {
  const { requestId, initialRequestProjectSignerList, requestSignerList } =
    params;
  const [projectSignerList, setProjectSignerList] = useState(
    initialRequestProjectSignerList
  );

  useEffect(() => {
    const channel = supabaseClient
      .channel("realtime request-project-signer-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "request_schema",
          table: "request_signer_table",
          filter: `request_signer_request_id=eq.${requestId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const signerTeamMember = requestSignerList.find(
              (signer) =>
                signer.signer_id === payload.new.request_signer_signer_id
            );

            if (signerTeamMember) {
              setProjectSignerList((signers) => {
                return signers.map((signer) => {
                  if (
                    signer.signer_team_member_id ===
                    signerTeamMember.signer_team_member.team_member_id
                  ) {
                    return {
                      ...signer,
                      signer_status: payload.new.request_signer_status,
                    };
                  } else return signer;
                });
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [supabaseClient, requestId, requestSignerList]);

  return projectSignerList;
};

export default useRealtimeProjectRequestSignerList;
