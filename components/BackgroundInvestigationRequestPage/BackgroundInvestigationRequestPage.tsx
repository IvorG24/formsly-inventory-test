import { getRequestComment } from "@/backend/api/get";
import RequestCommentList from "@/components/RequestPage/RequestCommentList";
import RequestDetailsSection from "@/components/RequestPage/RequestDetailsSection";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import { formatDate } from "@/utils/constant";
import { RequestCommentType, RequestWithResponseType } from "@/utils/types";
import { Container, Flex, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import RequestSection from "../RequestPage/RequestSection";

type Props = {
  request: RequestWithResponseType;
};

const BackgroundInvestigationRequestPage = ({ request }: Props) => {
  const supabaseClient = useSupabaseClient();

  const { setIsLoading } = useLoadingActions();

  const [requestCommentList, setRequestCommentList] = useState<
    RequestCommentType[]
  >([]);

  const formSection = generateSectionWithDuplicateList(
    request.request_form.form_section
  );

  const requestor = request.request_team_member.team_member_user;

  const requestDateCreated = formatDate(new Date(request.request_date_created));

  useEffect(() => {
    try {
      const fetchComments = async () => {
        const data = await getRequestComment(supabaseClient, {
          request_id: request.request_id,
        });
        setRequestCommentList(data);
      };
      fetchComments();
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <Container>
      <Flex justify="space-between" rowGap="xs" wrap="wrap">
        <Title order={2} color="dimmed">
          Evaluation
        </Title>
      </Flex>
      <Stack spacing="xl" mt="xl">
        <RequestDetailsSection
          request={request}
          requestor={requestor}
          requestDateCreated={requestDateCreated}
          requestStatus={request.request_status}
        />

        <Stack spacing="xl" mt="lg">
          {formSection.map((section, idx) => {
            return (
              <RequestSection
                key={section.section_id + idx}
                section={section}
                isFormslyForm={true}
                isOnlyWithResponse
                index={idx + 1}
                isPublicRequest={true}
              />
            );
          })}
        </Stack>
      </Stack>

      <RequestCommentList
        requestData={{
          requestId: request.request_id,
          requestOwnerId: request.request_team_member.team_member_user.user_id,
          teamId: request.request_team_member.team_member_team_id,
        }}
        requestCommentList={requestCommentList}
        setRequestCommentList={setRequestCommentList}
      />
    </Container>
  );
};

export default BackgroundInvestigationRequestPage;
