import {
  getCSICode,
  getCSIDescriptionOption,
  getProjectSignerWithTeamMember,
} from "@/backend/api/get";
import { createRequest } from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import RequestFormSigner from "@/components/CreateRequestPage/RequestFormSigner";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  FormType,
  FormWithResponseType,
  OptionTableRow,
  RequestResponseTableRow,
} from "@/utils/types";
import {
  Box,
  Button,
  Container,
  LoadingOverlay,
  Space,
  Stack,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

export type Section = FormWithResponseType["form_section"][0];
export type Field = FormType["form_section"][0]["section_field"][0];

export type RequestFormValues = {
  sections: Section[];
};

export type FieldWithResponseArray = Field & {
  field_response: RequestResponseTableRow[];
};

type Props = {
  form: FormType;
  projectOptions: OptionTableRow[];
};

const CreateSubconWorkAndServiceRequestPage = ({
  form,
  projectOptions,
}: Props) => {
  const router = useRouter();
  const formId = router.query.formId as string;
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const team = useActiveTeam();

  const [signerList, setSignerList] = useState(
    form.form_signer.map((signer) => ({
      ...signer,
      signer_action: signer.signer_action.toUpperCase(),
    }))
  );
  const [isFetchingSigner, setIsFetchingSigner] = useState(false);

  const requestorProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };

  const requestFormMethods = useForm<RequestFormValues>();
  const { handleSubmit, control, getValues } = requestFormMethods;
  const {
    fields: formSections,
    insert: addSection,
    remove: removeSection,
    update: updateSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  const handleCreateRequest = async (data: RequestFormValues) => {
    try {
      if (!requestorProfile) return;
      if (!teamMember) return;

      setIsLoading(true);

      const toBeCheckedSections = data.sections.slice(1);
      const newSections: RequestFormValues["sections"] = [];
      toBeCheckedSections.forEach((section) => {
        // if new section if empty
        if (newSections.length === 0) {
          newSections.push(section);
        } else {
          let uniqueItem = true;
          newSections.forEach((newSection) => {
            // if section general name is equal
            if (
              newSection.section_field[0].field_response ===
              section.section_field[0].field_response
            ) {
              let uniqueField = false;
              // loop on every field except name and quantity
              for (let i = 5; i < newSection.section_field.length; i++) {
                if (
                  newSection.section_field[i].field_response !==
                  section.section_field[i].field_response
                ) {
                  uniqueField = true;
                  break;
                }
              }
              if (!uniqueField) {
                newSection.section_field[2].field_response =
                  Number(newSection.section_field[2].field_response) +
                  Number(section.section_field[2].field_response);
                uniqueItem = false;
              }
            }
          });
          if (uniqueItem) {
            newSections.push(section);
          }
        }
      });

      const newData = {
        sections: [data.sections[0], ...newSections],
      };

      const response = data.sections[0].section_field[0]
        .field_response as string;

      const projectId = data.sections[0].section_field[0].field_option.find(
        (option) => option.option_value === response
      )?.option_id as string;

      const request = await createRequest(supabaseClient, {
        requestFormValues: newData,
        formId,
        teamMemberId: teamMember.team_member_id,
        signers: [...signerList],
        teamId: teamMember.team_member_team_id,
        requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
        formName: form.form_name,
        isFormslyForm: true,
        projectId,
        teamName: formatTeamNameToUrlKey(team.team_name ?? ""),
      });

      notifications.show({
        message: "Request created.",
        color: "green",
      });

      router.push(
        `/${formatTeamNameToUrlKey(team.team_name ?? "")}/requests/${
          request.request_formsly_id_prefix
        }-${request.request_formsly_id_serial}`
      );
    } catch (error) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateSection = (sectionId: string) => {
    const sectionLastIndex = formSections
      .map((sectionItem) => sectionItem.section_id)
      .lastIndexOf(sectionId);
    const sectionMatch = form.form_section.find(
      (section) => section.section_id === sectionId
    );
    if (sectionMatch) {
      const sectionDuplicatableId = uuidv4();
      const duplicatedFieldsWithDuplicatableId = sectionMatch.section_field.map(
        (field) => {
          return {
            ...field,
            field_section_duplicatable_id: sectionDuplicatableId,
          };
        }
      );
      const newSection = {
        ...sectionMatch,
        section_field: duplicatedFieldsWithDuplicatableId,
      };
      addSection(sectionLastIndex + 1, newSection);
      return;
    }
  };

  const handleRemoveSection = (sectionDuplicatableId: string) => {
    const sectionMatchIndex = formSections.findIndex(
      (section) =>
        section.section_field[0].field_section_duplicatable_id ===
        sectionDuplicatableId
    );
    if (sectionMatchIndex) {
      removeSection(sectionMatchIndex);
      return;
    }
  };

  const handleCSIDivisionChange = async (
    index: number,
    value: string | null
  ) => {
    const newSection = getValues(`sections.${index}`);

    if (value) {
      const csiCode = await getCSIDescriptionOption(supabaseClient, {
        divisionId: value,
      });

      const generalField = [
        ...newSection.section_field.slice(0, 5),
        {
          ...newSection.section_field[5],
          field_response: "",
          field_option: csiCode.map((code, index) => {
            return {
              option_id: code.csi_code_id,
              option_value: code.csi_code_level_three_description,
              option_order: index + 1,
              option_field_id: newSection.section_field[4].field_id,
            };
          }),
        },
        ...newSection.section_field.slice(6, 10).map((field) => {
          return {
            ...field,
            field_response: "",
          };
        }),
        ...newSection.section_field.slice(10),
      ];
      const duplicatableSectionId = index === 1 ? undefined : uuidv4();

      updateSection(index, {
        ...newSection,
        section_field: [
          ...generalField.map((field) => {
            return {
              ...field,
              field_section_duplicatable_id: duplicatableSectionId,
            };
          }),
        ],
      });
    } else {
      const generalField = [
        ...newSection.section_field.slice(0, 5),
        {
          ...newSection.section_field[5],
          field_response: "",
          field_option: [],
        },
        ...newSection.section_field.slice(6, 10).map((field) => {
          return {
            ...field,
            field_response: "",
          };
        }),
        ...newSection.section_field.slice(10),
      ];
      updateSection(index, {
        ...newSection,
        section_field: generalField,
      });
    }
  };

  const handleCSICodeChange = async (index: number, value: string | null) => {
    const newSection = getValues(`sections.${index}`);

    if (value) {
      const csiCode = await getCSICode(supabaseClient, { csiCode: value });

      const generalField = [
        ...newSection.section_field.slice(0, 6),
        {
          ...newSection.section_field[6],
          field_response: csiCode?.csi_code_section,
        },
        {
          ...newSection.section_field[7],
          field_response: csiCode?.csi_code_division_description,
        },
        {
          ...newSection.section_field[8],
          field_response: csiCode?.csi_code_level_two_major_group_description,
        },
        {
          ...newSection.section_field[9],
          field_response: csiCode?.csi_code_level_two_minor_group_description,
        },
        ...newSection.section_field.slice(10),
      ];
      const duplicatableSectionId = index === 1 ? undefined : uuidv4();

      updateSection(index, {
        ...newSection,
        section_field: [
          ...generalField.map((field) => {
            return {
              ...field,
              field_section_duplicatable_id: duplicatableSectionId,
            };
          }),
        ],
      });
    } else {
      const generalField = [
        ...newSection.section_field.slice(0, 6),
        ...newSection.section_field.slice(6, 10).map((field) => {
          return {
            ...field,
            field_response: "",
          };
        }),
        ...newSection.section_field.slice(10),
      ];
      updateSection(index, {
        ...newSection,
        section_field: generalField,
      });
    }
  };

  const resetSigner = () => {
    setSignerList(
      form.form_signer.map((signer) => ({
        ...signer,
        signer_action: signer.signer_action.toUpperCase(),
      }))
    );
  };

  const handleProjectNameChange = async (value: string | null) => {
    try {
      setIsFetchingSigner(true);
      if (value) {
        const projectId = projectOptions.find(
          (option) => option.option_value === value
        )?.option_id;
        if (projectId) {
          const data = await getProjectSignerWithTeamMember(supabaseClient, {
            projectId,
            formId,
          });
          if (data.length !== 0) {
            setSignerList(data as unknown as FormType["form_signer"]);
          } else {
            resetSigner();
          }
        }
      } else {
        resetSigner();
      }
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsFetchingSigner(false);
    }
  };

  return (
    <Container>
      <Title order={2} color="dimmed">
        Create Request
      </Title>
      <Space h="xl" />
      <FormProvider {...requestFormMethods}>
        <form onSubmit={handleSubmit(handleCreateRequest)}>
          <Stack spacing="xl">
            <RequestFormDetails formDetails={formDetails} />
            {formSections.map((section, idx) => {
              const sectionIdToFind = section.section_id;
              const sectionLastIndex = getValues("sections")
                .map((sectionItem) => sectionItem.section_id)
                .lastIndexOf(sectionIdToFind);

              return (
                <Box key={section.id}>
                  <RequestFormSection
                    key={section.section_id}
                    section={section}
                    sectionIndex={idx}
                    onRemoveSection={handleRemoveSection}
                    formslyFormName={form.form_name}
                    servicesFormMethods={{
                      onProjectNameChange: handleProjectNameChange,
                      onCSICodeChange: handleCSICodeChange,
                    }}
                  />
                  {section.section_is_duplicatable &&
                    idx === sectionLastIndex && (
                      <Button
                        mt="md"
                        variant="default"
                        onClick={() =>
                          handleDuplicateSection(section.section_id)
                        }
                        fullWidth
                      >
                        {section.section_name} +
                      </Button>
                    )}
                </Box>
              );
            })}
            <Box pos="relative">
              <LoadingOverlay visible={isFetchingSigner} overlayBlur={2} />
              <RequestFormSigner signerList={signerList} />
            </Box>
            <Button type="submit">Submit</Button>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default CreateSubconWorkAndServiceRequestPage;
