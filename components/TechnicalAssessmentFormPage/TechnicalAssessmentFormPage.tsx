import { updateFormSigner } from "@/backend/api/update";
import { UNHIDEABLE_FORMLY_FORMS } from "@/utils/constant";
import { Database } from "@/utils/database";
import {
  InitialFormType,
  TeamGroupTableRow,
  TeamMemberWithUserType,
  TeamProjectTableRow,
} from "@/utils/types";
import {
  Button,
  Center,
  Container,
  Flex,
  Group,
  Paper,
  Space,
  Stack,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { checkIfTeamGroupMember } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { isEmpty, isEqual } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import SignerSection, { RequestSigner } from "../FormBuilder/SignerSection";
import FormDetailsSection from "../RequestFormPage/FormDetailsSection";
import FormSectionList from "../RequestFormPage/FormSectionList";

type Props = {
  form: InitialFormType;
  teamMemberList: TeamMemberWithUserType[];
  teamGroupList: TeamGroupTableRow[];
  teamProjectList: TeamProjectTableRow[];
  teamProjectListCount: number;
};

const TechnicalAssessmentFormPage = ({ form, teamMemberList }: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();

  const formId = form.form_id;
  const teamMember = useUserTeamMember();

  const team = useActiveTeam();

  const initialSignerIds: string[] = [];
  const [activeSigner, setActiveSigner] = useState<number | null>(null);
  const [isSavingSigners, setIsSavingSigners] = useState(false);
  const [initialSigners, setIntialSigners] = useState(
    form.form_signer.map((signer) => {
      initialSignerIds.push(signer.signer_team_member.team_member_id);
      const requestSigner = {
        signer_id: signer.signer_id,
        signer_team_member_id: signer.signer_team_member.team_member_id,
        signer_action: signer.signer_action,
        signer_is_primary_signer: signer.signer_is_primary_signer,
        signer_order: signer.signer_order,
        signer_form_id: formId,
      } as RequestSigner;
      return requestSigner;
    })
  );

  const [isGroupMember, setIsGroupMember] = useState(false);

  useEffect(() => {
    const checkIfMember = async () => {
      if (teamMember) {
        const isMember = await checkIfTeamGroupMember(supabaseClient, {
          teamMemberId: teamMember.team_member_id,
          groupId: form.form_team_group.map(
            (group) => group.team_group.team_group_id
          ),
        });
        setIsGroupMember(isMember);
      }
    };
    checkIfMember();
  }, [teamMember]);

  const signerMethods = useForm<{
    signers: RequestSigner[];
    isSignatureRequired: boolean;
  }>();

  useEffect(() => {
    const initialRequestSigners = form.form_signer.map((signer) => {
      return {
        signer_id: signer.signer_id,
        signer_team_member_id: signer.signer_team_member.team_member_id,
        signer_action: signer.signer_action,
        signer_is_primary_signer: signer.signer_is_primary_signer,
        signer_order: signer.signer_order,
        signer_form_id: formId,
      };
    });
    signerMethods.setValue("signers", initialRequestSigners);
  }, [form]);

  const handleSaveSigners = async () => {
    const values = signerMethods.getValues();
    const primarySigner = values.signers.filter(
      (signer) => signer.signer_is_primary_signer
    );
    if (isEmpty(primarySigner)) {
      notifications.show({
        message: "There must be atleast one primary signer.",
        color: "orange",
      });
      return;
    }

    setIsSavingSigners(true);
    try {
      await updateFormSigner(supabaseClient, {
        signers: values.signers.map((signer) => {
          return { ...signer, signer_is_disabled: false };
        }),
        selectedProjectId: null,
        formId,
      });
      setIntialSigners(values.signers);
      notifications.show({
        message: "Signers updated.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
    setIsSavingSigners(false);
  };

  return (
    <Container>
      <Flex justify="space-between">
        <Title order={2} color="dimmed">
          Form Preview
        </Title>
        <Group>
          <Button
            onClick={async () =>
              await router.push({
                pathname: `/${formatTeamNameToUrlKey(
                  team.team_name
                )}/dashboard/`,
                query: { ...router.query, formId },
              })
            }
            variant="light"
          >
            Analytics
          </Button>

          {(form.form_is_formsly_form &&
            !UNHIDEABLE_FORMLY_FORMS.includes(form.form_name) &&
            isGroupMember) ||
          (!form.form_is_formsly_form && isGroupMember) ? (
            <Button
              onClick={async () =>
                await router.push(
                  `/${formatTeamNameToUrlKey(
                    team.team_name
                  )}/forms/${formId}/create`
                )
              }
            >
              Create Request
            </Button>
          ) : null}
        </Group>
      </Flex>
      <Stack spacing="xl" mt="xl">
        <FormDetailsSection form={form} />

        <FormSectionList formId={form.form_id} formName={form.form_name} />

        <Paper p="xl" shadow="xs">
          <Title order={3}>
            {form.form_is_formsly_form ? "Default Signer" : "Signer Details"}
          </Title>
          <Space h="xl" />
          <FormProvider {...signerMethods}>
            <SignerSection
              teamMemberList={teamMemberList}
              formId={formId}
              activeSigner={activeSigner}
              onSetActiveSigner={setActiveSigner}
              initialSignerIds={initialSignerIds}
            />
          </FormProvider>

          {!isEqual(initialSigners, signerMethods.getValues("signers")) &&
          activeSigner === null ? (
            <Center mt="xl">
              <Button loading={isSavingSigners} onClick={handleSaveSigners}>
                Save Changes
              </Button>
            </Center>
          ) : null}
        </Paper>
      </Stack>
    </Container>
  );
};

export default TechnicalAssessmentFormPage;
