import { updateFormSigner } from "@/backend/api/update";
import { BASE_URL, UNHIDEABLE_FORMLY_FORMS } from "@/utils/constant";
import { Database } from "@/utils/database";
import {
  AdOwnerTableRow,
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
  Menu,
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

import { checkIfTeamGroupMember, getAdOwnerList } from "@/backend/api/get";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { isEmpty, isEqual } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";

import { useClipboard } from "@mantine/hooks";
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

const ApplicationInformationFormPage = ({ form, teamMemberList }: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();

  const formId = form.form_id;
  const teamMember = useUserTeamMember();

  const team = useActiveTeam();
  const clipboard = useClipboard({ timeout: 500 });

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
  const [adOwnerList, setAdOwnerList] = useState<AdOwnerTableRow[]>([]);

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

  const handleFetchAdOwners = async () => {
    const adOwnerList = await getAdOwnerList(supabaseClient);
    setAdOwnerList(adOwnerList);
  };

  const generateCreateRequestURLWithAdOwner = ({
    url,
    adOwnerId,
  }: {
    url: string;
    adOwnerId: string;
  }) => {
    const newUrl = `${url}?ad-owner=${adOwnerId}`;
    clipboard.copy(newUrl);
    if (clipboard.copied) {
      notifications.show({
        message: "Request link copied.",
        color: "green",
      });
      return;
    } else {
      notifications.show({
        message: "Request link copied.",
        color: "green",
      });
      return;
    }
  };

  useEffect(() => {
    handleFetchAdOwners();
  }, []);

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
          {adOwnerList.length > 0 ? (
            <Menu withArrow>
              <Menu.Target>
                <Button>Copy Request Link</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Ad Owners</Menu.Label>
                {adOwnerList.map((adOwner) => (
                  <Menu.Item
                    key={adOwner.ad_owner_id}
                    onClick={() =>
                      generateCreateRequestURLWithAdOwner({
                        url: `${BASE_URL}/public-form/${form.form_id}/create`,
                        adOwnerId: adOwner.ad_owner_id,
                      })
                    }
                  >
                    {adOwner.ad_owner_name.toUpperCase()}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          ) : null}

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

export default ApplicationInformationFormPage;
