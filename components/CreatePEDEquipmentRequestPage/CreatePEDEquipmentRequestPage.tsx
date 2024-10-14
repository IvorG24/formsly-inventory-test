import {
  getEquipmentName,
  getEquipmentSectionChoices,
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
import { useEffect, useState } from "react";
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
  categoryOptions: OptionTableRow[];
};

const CreatePEDEquipmentRequestPage = ({
  form,
  projectOptions,
  categoryOptions,
}: Props) => {
  const router = useRouter();
  const formId = router.query.formId as string;
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const team = useActiveTeam();
  const requestorProfile = useUserProfile();

  const [signerList, setSignerList] = useState(
    form.form_signer.map((signer) => ({
      ...signer,
      signer_action: signer.signer_action.toUpperCase(),
    }))
  );
  const [isFetchingSigner, setIsFetchingSigner] = useState(false);
  const [loadingFieldList, setLoadingFieldList] = useState<
    { sectionIndex: number; fieldIndex: number }[]
  >([]);

  const { setIsLoading } = useLoadingActions();

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };

  const requestFormMethods = useForm<RequestFormValues>();
  const { handleSubmit, control, getValues, setValue } = requestFormMethods;
  const {
    fields: formSections,
    insert: insertSection,
    remove: removeSection,
    replace: replaceSection,
    update: updateSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  useEffect(() => {
    const newFields = form.form_section[1].section_field.map((field) => field);
    replaceSection([
      form.form_section[0],
      {
        ...form.form_section[1],
        section_field: newFields,
      },
    ]);
  }, [form, requestFormMethods]);

  const handleCreateRequest = async (data: RequestFormValues) => {
    try {
      if (!requestorProfile || !teamMember) return;

      setIsLoading(true);

      const response = data.sections[0].section_field[0]
        .field_response as string;

      const projectId = data.sections[0].section_field[0].field_option.find(
        (option) => option.option_value === response
      )?.option_id as string;

      const request = await createRequest(supabaseClient, {
        requestFormValues: data,
        formId,
        teamMemberId: teamMember.team_member_id,
        signers: signerList,
        teamId: teamMember.team_member_team_id,
        requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
        formName: form.form_name,
        isFormslyForm: true,
        projectId,
        teamName: formatTeamNameToUrlKey(team.team_name ?? ""),
        userId: requestorProfile.user_id,
      });

      notifications.show({
        message: "Request created.",
        color: "green",
      });

      await router.push(
        `/${formatTeamNameToUrlKey(team.team_name ?? "")}/requests/${
          request.request_formsly_id_prefix
        }-${request.request_formsly_id_serial}`
      );
    } catch (e) {
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
        (field) => ({
          ...field,
          field_section_duplicatable_id: sectionDuplicatableId,
        })
      );
      const newSection = {
        ...sectionMatch,
        section_field: duplicatedFieldsWithDuplicatableId,
      };
      insertSection(sectionLastIndex + 1, newSection);
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
      setValue(`sections.0.section_field.0.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsFetchingSigner(false);
    }
  };

  const handleCategoryChange = async (value: string | null, index: number) => {
    const newSection = getValues(`sections.${index}`);
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: index, fieldIndex: 1 }]);
        const categoryId = categoryOptions.find(
          (category) => category.option_value === value
        );
        if (!categoryId) return;
        const equipmentName = await getEquipmentName(supabaseClient, {
          category: categoryId.option_id,
        });

        const generalField = [
          {
            ...newSection.section_field[0],
          },
          {
            ...newSection.section_field[1],
            field_response: "",
            field_option: equipmentName.map((equipment, index) => {
              return {
                option_field_id: form.form_section[0].section_field[0].field_id,
                option_id: equipment.equipment_id,
                option_order: index,
                option_value: equipment.equipment_name,
              };
            }),
          },
          ...newSection.section_field.slice(2, 4).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
          ...newSection.section_field.slice(4),
        ];

        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          {
            ...newSection.section_field[0],
            field_response: "",
          },
          ...newSection.section_field.slice(1, 4).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
          ...newSection.section_field.slice(4),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.${0}.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleEquipmentNameChange = async (
    value: string | null,
    index: number
  ) => {
    const newSection = getValues(`sections.${index}`);
    try {
      if (value) {
        setLoadingFieldList([
          { sectionIndex: index, fieldIndex: 2 },
          { sectionIndex: index, fieldIndex: 3 },
        ]);
        const brandChoices = await getEquipmentSectionChoices(supabaseClient, {
          category: newSection.section_field[0].field_response as string,
          equipmentName: value,
        });

        const generalField = [
          ...newSection.section_field.slice(0, 2),
          {
            ...newSection.section_field[2],
            field_response: "ANY",
            field_option: [
              {
                option_field_id: form.form_section[0].section_field[0].field_id,
                option_id: uuidv4(),
                option_order: index,
                option_value: "ANY",
              },
              ...brandChoices.map((equipment, index) => {
                const formattedChoice = equipment as {
                  equipment_description_brand: {
                    equipment_brand: string;
                  };
                };
                return {
                  option_field_id:
                    form.form_section[0].section_field[0].field_id,
                  option_id:
                    formattedChoice.equipment_description_brand.equipment_brand,
                  option_order: index,
                  option_value:
                    formattedChoice.equipment_description_brand.equipment_brand,
                };
              }),
            ],
          },
          {
            ...newSection.section_field[3],
            field_response: "ANY",
            field_option: [
              {
                option_field_id: form.form_section[0].section_field[0].field_id,
                option_id: uuidv4(),
                option_order: index,
                option_value: "ANY",
              },
            ],
          },
          ...newSection.section_field.slice(4),
        ];

        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          ...newSection.section_field.slice(0, 2),
          ...newSection.section_field.slice(2, 4).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
          ...newSection.section_field.slice(4),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.1.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleBrandChange = async (value: string | null, index: number) => {
    const newSection = getValues(`sections.${index}`);
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: index, fieldIndex: 3 }]);
        const modelChoices = await getEquipmentSectionChoices(supabaseClient, {
          category: newSection.section_field[0].field_response as string,
          equipmentName: newSection.section_field[1].field_response as string,
          brand: value,
        });

        const generalField = [
          ...newSection.section_field.slice(0, 3),
          {
            ...newSection.section_field[3],
            field_response: "ANY",
            field_option: [
              {
                option_field_id: form.form_section[0].section_field[0].field_id,
                option_id: uuidv4(),
                option_order: index,
                option_value: "ANY",
              },
              ...modelChoices.map((equipment, index) => {
                const formattedChoice = equipment as {
                  equipment_description_model: {
                    equipment_model: string;
                  };
                };
                return {
                  option_field_id:
                    form.form_section[0].section_field[0].field_id,
                  option_id:
                    formattedChoice.equipment_description_model.equipment_model,
                  option_order: index,
                  option_value:
                    formattedChoice.equipment_description_model.equipment_model,
                };
              }),
            ],
          },
          ...newSection.section_field.slice(4),
        ];

        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          ...newSection.section_field.slice(0, 3),
          {
            ...newSection.section_field[3],
            field_response: "ANY",
            field_option: [
              {
                option_field_id: form.form_section[0].section_field[0].field_id,
                option_id: uuidv4(),
                option_order: index,
                option_value: "ANY",
              },
            ],
          },

          ...newSection.section_field.slice(4),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.2.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
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
                    pedEquipmentFormMethods={{
                      onCategoryChange: handleCategoryChange,
                      onProjectNameChange: handleProjectNameChange,
                      onEquipmentNameChange: handleEquipmentNameChange,
                      onBrandChange: handleBrandChange,
                    }}
                    loadingFieldList={loadingFieldList}
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

export default CreatePEDEquipmentRequestPage;
