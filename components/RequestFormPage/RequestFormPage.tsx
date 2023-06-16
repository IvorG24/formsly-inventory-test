import { updateFormSigner } from "@/backend/api/update";
import { UNHIDEABLE_FORMLY_FORMS } from "@/utils/constant";
import { Database } from "@/utils/database";
import { FormType, TeamMemberWithUserType } from "@/utils/types";
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
import { isEmpty, isEqual } from "lodash";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import SignerSection, { RequestSigner } from "../FormBuilder/SignerSection";
import FormDetailsSection from "./FormDetailsSection";
import FormSection from "./FormSection";

type Props = {
  form: FormType;
  teamMemberList: TeamMemberWithUserType[];
};

const RequestFormPage = ({ form, teamMemberList }: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const { formId } = router.query;

  const initialSignerIds: string[] = [];
  const [activeSigner, setActiveSigner] = useState<number | null>(null);
  const [isSavingSigners, setIsSavingSigner] = useState(false);
  const [initialSigners, setIntialSigners] = useState(
    form.form_signer.map((signer) => {
      initialSignerIds.push(signer.signer_team_member.team_member_id);
      const requestSigner = {
        signer_id: signer.signer_id,
        signer_team_member_id: signer.signer_team_member.team_member_id,
        signer_action: signer.signer_action,
        signer_is_primary_signer: signer.signer_is_primary_signer,
        signer_order: signer.signer_order,
        signer_form_id: formId as string,
      } as RequestSigner;
      return requestSigner;
    })
  );

  const methods = useForm<{
    signers: RequestSigner[];
    isSignatureRequired: boolean;
  }>({});

  useEffect(() => {
    const initialRequestSigners = form.form_signer.map((signer) => {
      return {
        signer_id: signer.signer_id,
        signer_team_member_id: signer.signer_team_member.team_member_id,
        signer_action: signer.signer_action,
        signer_is_primary_signer: signer.signer_is_primary_signer,
        signer_order: signer.signer_order,
        signer_form_id: `${formId}`,
      };
    });
    methods.setValue("signers", initialRequestSigners);
  }, [form]);

  const handleSaveSigners = async () => {
    const values = methods.getValues();
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

    setIsSavingSigner(true);
    try {
      await updateFormSigner(supabaseClient, {
        signers: values.signers.map((signer) => {
          return { ...signer, signer_is_disabled: false };
        }),
        formId: formId as string,
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
    setIsSavingSigner(false);
  };

  return (
    <Container>
      <Flex justify="space-between">
        <Title order={2} color="dimmed">
          Form Preview
        </Title>
        <Group>
          <Button
            onClick={() =>
              router.push(`/team-requests/forms/${formId}/analytics`)
            }
            variant="light"
          >
            Analytics
          </Button>

          {!form.form_is_formsly_form ||
          (form.form_is_formsly_form &&
            !UNHIDEABLE_FORMLY_FORMS.includes(form.form_name)) ? (
            <Button
              onClick={() =>
                router.push(`/team-requests/forms/${formId}/create`)
              }
            >
              Create Request
            </Button>
          ) : null}
        </Group>
      </Flex>
      <Stack spacing="xl" mt="xl">
        <FormDetailsSection form={form} />

        {form.form_section.map((section) => (
          <FormSection section={section} key={section.section_id} />
        ))}

        <Paper p="xl" shadow="xs" mt="xl">
          <Title order={3}>Signer Details</Title>
          <Space h="xl" />
          <FormProvider {...methods}>
            <SignerSection
              teamMemberList={teamMemberList}
              formId={`${formId}`}
              activeSigner={activeSigner}
              onSetActiveSigner={setActiveSigner}
              initialSignerIds={initialSignerIds}
            />
          </FormProvider>

          {!isEqual(initialSigners, methods.getValues("signers")) &&
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

export default RequestFormPage;
