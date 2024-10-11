import { createRequestForm } from "@/backend/api/post";
import { useFormActions } from "@/stores/useFormStore";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserTeamMember } from "@/stores/useUserStore";
import { defaultRequestFormBuilderSection } from "@/utils/constant";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import { AppType, TeamGroupTableRow } from "@/utils/types";
import {
  Box,
  Button,
  Container,
  Divider,
  LoadingOverlay,
  createStyles,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import FormBuilder, { FormBuilderData } from "../FormBuilder/FormBuilder";

const useStyles = createStyles((theme) => ({
  formNameInput: {
    '& input[type="text"]': {
      fontFamily: "Montserrat, sans-serif",
      fontWeight: 600,
      fontSize: 24,
    },
  },
  button: {
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : "#444746",
    fontWeight: 400,
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },
}));

type Props = {
  formId: string;
  groupList: TeamGroupTableRow[];
};

const BuildFormPage = ({ formId, groupList }: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMemberList = useTeamMemberList("OWNER & APPROVER");
  const teamMember = useUserTeamMember();
  const formType: AppType = "REQUEST";
  const team = useActiveTeam();
  const { classes } = useStyles();

  const { addForm } = useFormActions();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [activeSigner, setActiveSigner] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: FormBuilderData = {
    formId: formId,
    formName: "",
    formDescription: "",
    formType,
    revieweeList: null,
    sections: defaultRequestFormBuilderSection(formId),
    signers: [],
    isSignatureRequired: false,
    isForEveryone: true,
    groupList: [],
  };

  const methods = useForm<FormBuilderData>({
    defaultValues: defaultValues,
  });

  const { getValues, control } = methods;

  const {
    fields: sections,
    remove: removeSection,
    insert: insertSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  const checkForError = (formData: FormBuilderData) => {
    let error = "";
    let hasNoChoices = false;
    formData.sections.forEach((section) => {
      if (section.section_name?.length === 0) {
        error = "Each section should have a name";
      }
      if (section.fields.length === 0) {
        error = "At least 1 question per section is required";
      } else {
        section.fields.map((field) => {
          if (field.field_name.length === 0) {
            error = "Question label is required on each question";
          }
          if (
            (field.field_type === "MULTISELECT" ||
              field.field_type === "DROPDOWN") &&
            field.options.length <= 0 &&
            field.field_special_field_template_id === null
          )
            hasNoChoices = true;
        });
      }
    });

    if (!error) {
      if (formData.formName.length <= 0) error = "Form name is required";
      else if (formData.formDescription.length === 0) {
        error = "Form description is required";
      } else if (formData.sections.length === 0) {
        error = "At least 1 section is required";
      } else if (formData.signers.length === 0) {
        error = "At least 1 signer is required";
      } else if (
        formData.signers.filter((signer) => signer.signer_is_primary_signer)
          .length <= 0
      ) {
        error = "At least 1 primary signer is required";
      } else if (
        formData.signers.filter(
          (signer) => signer.signer_team_member_id.length <= 0
        ).length > 0
      )
        error = "Signer is required";
      else if (
        formData.signers.filter((signer) => signer.signer_action.length <= 0)
          .length > 0
      )
        error = "Signer action is required";
      else if (hasNoChoices)
        error = "At least one option is required in a Dropdown or Multiselect";
    }

    if (error.length > 0) {
      notifications.show({
        message: error,
        color: "orange",
      });
      return true;
    }
    return false;
  };

  const handleSaveForm = async (formData: FormBuilderData) => {
    if (checkForError(formData)) return;
    if (!teamMember) return;
    try {
      setIsSubmitting(true);
      const createdForm = await createRequestForm(supabaseClient, {
        formBuilderData: formData,
        teamMemberId: teamMember.team_member_id,
      });
      addForm(createdForm);
      notifications.show({
        message: "Form created.",
        color: "green",
      });

      await router.push(
        `/${formatTeamNameToUrlKey(team.team_name ?? "")}/forms/${
          createdForm.form_id
        }`
      );
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Container fluid>
      <LoadingOverlay
        visible={isSubmitting}
        overlayBlur={2}
        sx={{ position: "fixed" }}
      />
      <FormProvider {...methods}>
        <Container maw={768} p={0}>
          <FormBuilder.Container mt="xl">
            <Box>
              <FormBuilder.FormNameInput />
              <FormBuilder.DescriptionInput mt={32} />
            </Box>
          </FormBuilder.Container>

          {sections.length > 0 &&
            sections.map((section, sectionIndex) => {
              return (
                <FormBuilder.Section
                  key={section.id}
                  mt={32}
                  section={section}
                  sectionIndex={sectionIndex}
                  onDelete={() => removeSection(sectionIndex)}
                  fields={section.fields}
                  formType={formType}
                  mode={section.section_order === 999 ? "view" : "edit"}
                  activeField={activeField}
                  onSetActiveField={setActiveField}
                />
              );
            })}

          {/* add new section divider */}
          <Divider
            maw={768}
            mx="auto"
            labelPosition="center"
            mt={24}
            label={
              <Button
                leftIcon={<IconPlus height={20} />}
                variant="subtle"
                className={classes.button}
                onClick={() =>
                  insertSection(sections.length, {
                    section_id: uuidv4(),
                    section_name: "",
                    section_form_id: formId,
                    section_order: sections.length + 1,
                    section_is_duplicatable: false,
                    fields: [],
                  })
                }
              >
                Add New Section
              </Button>
            }
          />

          {formType === "REQUEST" && (
            <FormBuilder.GroupSection
              mt={32}
              teamGroupList={groupList.map((group) => {
                return {
                  label: group.team_group_name,
                  value: group.team_group_id,
                };
              })}
            />
          )}

          {formType === "REQUEST" && (
            <FormBuilder.SignerSection
              mt={32}
              formId={formId}
              teamMemberList={teamMemberList}
              activeSigner={activeSigner}
              onSetActiveSigner={setActiveSigner}
            />
          )}

          <FormBuilder.SubmitButton
            mt={32}
            onClick={() => handleSaveForm(getValues())}
            disabled={activeSigner !== null || activeField !== null}
          >
            Finish Building Form
          </FormBuilder.SubmitButton>
        </Container>
      </FormProvider>
    </Container>
  );
};

export default BuildFormPage;
