import { GetTeam } from "@/utils/queries-new";
import { setBadgeColor } from "@/utils/request";
import { Box, Divider, Group, Text, Title } from "@mantine/core";
// import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { startCase } from "lodash";
// import { useEffect, useState } from "react";
import { ReducedRequestType } from "./RequestList";

type Props = {
  request: ReducedRequestType;
  attachments: { filepath: string; url: string | null }[] | undefined;
  approver?: GetTeam[0] | undefined;
  purchaser?: GetTeam[0] | undefined;
};

const PdfPreview = ({ request, attachments, approver, purchaser }: Props) => {
  // const supabaseClient = useSupabaseClient();
  // const [approverSignatureUrl, setApproverSignatureUrl] = useState("");
  // const [purchaserSignatureUrl, setPurchaserSignatureUrl] = useState("");

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       console.log(approver?.user_signature_filepath);
  //       const approverSignature = await getFileUrl(
  //         supabaseClient,
  //         approver?.user_signature_filepath as string,
  //         "signatures"
  //       );
  //       console.log(approverSignature);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   })();
  // }, [approver, supabaseClient]);

  return (
    <Box
      id={`${request.request_id}`}
      p="md"
      sx={{
        border: "1px solid #e9e9e9",
        backgroundColor: "#FFFFFF",
      }}
    >
      <Title align="center" order={4} mb="md">
        {request.team_name?.toUpperCase()}
      </Title>

      <Group position="apart">
        <Text fz="md" fw={700} c="dark.9">
          {request.form_name}
        </Text>

        <Text
          fw={700}
          color={setBadgeColor(request.request_status_id as string)}
        >
          {startCase(request.request_status_id as string)}
        </Text>
      </Group>
      <Divider my="xs" />
      <Group position="apart">
        <Text fw={500} c="dark.9">
          {request.request_title}
        </Text>
      </Group>
      <Text c="dark.9">{request.request_date_created?.slice(0, 10)}</Text>
      <Text my="sm" c="dark.9">
        {request.request_description}
      </Text>
      <Divider mb="sm" />
      <Text fw={500} c="dark.9">
        Request Form
      </Text>
      {request.fields.map((f, idx: number) => {
        return (
          <Box key={idx} p="xs">
            <Group>
              <Text fw={500} c="dark.9">
                Q:
              </Text>
              <Text c="dark.9">{f.label}</Text>
            </Group>
            <Group>
              <Text fw={500} c="dark.9">
                A:
              </Text>
              <Text c="dark.9">{f.value ? f.value : "N/A"}</Text>
            </Group>
          </Box>
        );
      })}
      <Divider my="sm" />

      <Group>
        {purchaser ? (
          <Box>
            <Text fw={500} c="dark.9">
              Purchased By
            </Text>
            {/* <Image
              src={purchaserSignatureUrl}
              alt={purchaser.user_signature_filepath as string}
              width={50}
              height={50}
            /> */}
            <Text c="dark.9">{`${purchaser.user_first_name} ${purchaser.user_last_name}`}</Text>
          </Box>
        ) : (
          <Text>No Purchaser</Text>
        )}
        {approver ? (
          <Box>
            <Text fw={500} c="dark.9">
              Approved By
            </Text>
            {/* <Image
                src={approverSignatureUrl}
                alt={request.user_signature_filepath as string}
                width={50}
                height={50}
              /> */}
            <Text c="dark.9">
              {approver?.user_first_name} {approver?.user_last_name}
            </Text>
          </Box>
        ) : (
          <Text>No Approver</Text>
        )}
      </Group>
      <Box mt="md">
        <Text fw={500} c="dark.9">
          Attachments
        </Text>
        {attachments?.map((item, idx: number) => {
          return <Text key={idx}>{item.filepath}</Text>;
        })}
      </Box>
    </Box>
  );
};

export default PdfPreview;
