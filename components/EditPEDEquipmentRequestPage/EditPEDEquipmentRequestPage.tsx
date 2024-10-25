import {
  getCapacityUnitOfMeasurementOptions,
  getEquipmentName,
  getEquipmentSectionChoices,
  getNonDuplictableSectionResponse,
  getPEDEquipmentCategoryOptions,
  getPEDEquipmentRequestConditionalOptions,
  getProjectSignerWithTeamMember,
  getSectionInRequestPage,
} from "@/backend/api/get";
import { createRequest, editRequest } from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import RequestFormSigner from "@/components/CreateRequestPage/RequestFormSigner";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import { FETCH_OPTION_LIMIT } from "@/utils/constant";
import { Database } from "@/utils/database";
import { safeParse } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  FormType,
  FormWithResponseType,
  OptionTableRow,
  RequestResponseTableRow,
  RequestTableRow,
  RequestWithResponseType,
} from "@/utils/types";
import {
  Box,
  Button,
  Container,
  Flex,
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
import InvalidSignerNotification from "../InvalidSignerNotification/InvalidSignerNotification";

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
  duplicatableSectionIdList: string[];
  requestId: string;
};

const EditPEDEquipmentRequestPage = ({
  form,
  projectOptions,
  duplicatableSectionIdList,
  requestId,
}: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const team = useActiveTeam();

  const isReferenceOnly = Boolean(router.query.referenceOnly);

  const [initialRequestDetails, setInitialRequestDetails] =
    useState<RequestFormValues>();
  const [signerList, setSignerList] = useState(
    form.form_signer.map((signer) => ({
      ...signer,
      signer_action: signer.signer_action.toUpperCase(),
    }))
  );
  const [isFetchingSigner, setIsFetchingSigner] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<OptionTableRow[]>([]);
  const [unitOfMeasurementOptions, setUnitOfMeasurementOptions] = useState<
    OptionTableRow[]
  >([]);
  const [loadingFieldList, setLoadingFieldList] = useState<
    { sectionIndex: number; fieldIndex: number }[]
  >([]);

  const requestorProfile = useUserProfile();
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
    setIsLoading(true);
    if (!team.team_id) return;
    try {
      const fetchRequestDetails = async () => {
        // Fetch unconditional option
        // Fetch category option
        let index = 0;
        const categoryOptionList: OptionTableRow[] = [];
        while (1) {
          const categoryData = await getPEDEquipmentCategoryOptions(
            supabaseClient,
            {
              teamId: team.team_id,
              index,
              limit: FETCH_OPTION_LIMIT,
            }
          );
          const categoryOptions = categoryData.map((category, index) => {
            return {
              option_field_id: form.form_section[1].section_field[0].field_id,
              option_id: category.equipment_category_id,
              option_order: index,
              option_value: category.equipment_category,
            };
          });
          categoryOptionList.push(...categoryOptions);

          if (categoryOptions.length < FETCH_OPTION_LIMIT) break;
          index += FETCH_OPTION_LIMIT;
        }
        setCategoryOptions(categoryOptionList);

        // Fetch unit of measurement option
        index = 0;
        const unitOfMeasurementOptionlist: OptionTableRow[] = [];
        while (1) {
          const unitOfMeasurementData =
            await getCapacityUnitOfMeasurementOptions(supabaseClient, {
              teamId: team.team_id,
              index,
              limit: FETCH_OPTION_LIMIT,
            });
          const uomOptions = unitOfMeasurementData.map((uom, index) => {
            return {
              option_field_id: form.form_section[1].section_field[5].field_id,
              option_id: uom.capacity_unit_of_measurement_id,
              option_order: index,
              option_value: uom.capacity_unit_of_measurement,
            };
          });
          unitOfMeasurementOptionlist.push(...uomOptions);

          if (uomOptions.length < FETCH_OPTION_LIMIT) break;
          index += FETCH_OPTION_LIMIT;
        }
        setUnitOfMeasurementOptions(unitOfMeasurementOptionlist);

        // Fetch response
        // Non duplicatable section response
        const nonDuplicatableSectionResponse =
          await getNonDuplictableSectionResponse(supabaseClient, {
            requestId,
            fieldIdList: form.form_section[0].section_field.map(
              (field) => field.field_id
            ),
          });
        const nonDuplicatableSectionField =
          form.form_section[0].section_field.map((field) => {
            const response = nonDuplicatableSectionResponse.find(
              (response) =>
                response.request_response_field_id === field.field_id
            );
            return {
              ...field,
              field_response: response
                ? safeParse(response.request_response)
                : "",
            };
          });

        // Duplicatable section response
        index = 0;
        const newFields: RequestWithResponseType["request_form"]["form_section"][0]["section_field"] =
          [];
        while (1) {
          setIsLoading(true);
          const duplicatableSectionIdCondition = duplicatableSectionIdList
            .slice(index, index + 5)
            .map((dupId) => `'${dupId}'`)
            .join(",");

          const data = await getSectionInRequestPage(supabaseClient, {
            index,
            requestId: requestId,
            sectionId: form.form_section[1].section_id,
            duplicatableSectionIdCondition:
              duplicatableSectionIdCondition.length !== 0
                ? duplicatableSectionIdCondition
                : `'${uuidv4()}'`,
            withOption: true,
          });
          newFields.push(...data);
          index += 5;

          if (index > duplicatableSectionIdList.length) break;
        }

        const uniqueFieldIdList: string[] = [];
        const combinedFieldList: RequestWithResponseType["request_form"]["form_section"][0]["section_field"] =
          [];
        newFields.forEach((field) => {
          if (uniqueFieldIdList.includes(field.field_id)) {
            const currentFieldIndex = combinedFieldList.findIndex(
              (combinedField) => combinedField.field_id === field.field_id
            );
            combinedFieldList[currentFieldIndex].field_response.push(
              ...field.field_response
            );
          } else {
            uniqueFieldIdList.push(field.field_id);
            combinedFieldList.push(field);
          }
        });

        // Format section
        const newSection = generateSectionWithDuplicateList([
          {
            ...form.form_section[1],
            section_field: combinedFieldList,
          },
        ]);

        // Input option to the sections
        const formattedSection = newSection.map((section) => {
          const fieldList: Section["section_field"] = [];
          section.section_field.forEach((field, fieldIndex) => {
            const response = field.field_response?.request_response
              ? safeParse(field.field_response?.request_response)
              : "";
            let option: OptionTableRow[] = field.field_option ?? [];
            switch (fieldIndex) {
              case 0:
                option = categoryOptionList;
                break;
              case 5:
                option = unitOfMeasurementOptionlist;
                break;
            }
            if (response) {
              fieldList.push({
                ...field,
                field_response: response,
                field_option: option,
              });
            }
          });

          return {
            ...section,
            section_field: fieldList,
          };
        });

        // Fetch conditional options
        const conditionalOptionList: {
          category: string;
          equipmentName: string;
          brand: string;
          fieldList: {
            fieldId: string;
            optionList: OptionTableRow[];
          }[];
        }[] = [];

        index = 0;
        while (1) {
          const optionData = await getPEDEquipmentRequestConditionalOptions(
            supabaseClient,
            {
              sectionList: formattedSection
                .slice(index, index + 5)
                .map((section) => {
                  return {
                    category: `${section.section_field[0].field_response}`,
                    equipmentName: `${section.section_field[1].field_response}`,
                    brand: `${section.section_field[2].field_response}`,
                    fieldIdList: [
                      ...section.section_field
                        .slice(1, 4)
                        .map((field) => field.field_id),
                    ],
                  };
                }),
            }
          );
          conditionalOptionList.push(...optionData);
          if (optionData.length < 5) break;
          index += 5;
        }

        // Insert option to section list
        formattedSection.forEach((section, sectionIndex) => {
          const equipmentIndex = conditionalOptionList.findIndex(
            (value) =>
              value.category === section.section_field[0].field_response &&
              value.equipmentName === section.section_field[1].field_response &&
              value.brand === section.section_field[2].field_response
          );
          if (equipmentIndex === -1) return;

          conditionalOptionList[equipmentIndex].fieldList.forEach((field) => {
            const fieldIndex = section.section_field.findIndex(
              (value) => value.field_id === field.fieldId
            );
            if (fieldIndex === -1) return;

            formattedSection[sectionIndex].section_field[
              fieldIndex
            ].field_option = field.optionList;
          });
        });

        // Add duplicatable section id
        const sectionWithDuplicatableId = formattedSection.map(
          (section, index) => {
            const dupId = index ? uuidv4() : undefined;
            return {
              ...section,
              section_field: section.section_field.map((field) => {
                return {
                  ...field,
                  field_section_duplicatable_id: dupId,
                };
              }),
            };
          }
        );

        // fetch additional signer
        handleProjectNameChange(nonDuplicatableSectionField[0].field_response);

        const finalInitialRequestDetails = [
          {
            ...form.form_section[0],
            section_field: nonDuplicatableSectionField,
          },
          ...sectionWithDuplicatableId,
        ];

        replaceSection(finalInitialRequestDetails);
        setInitialRequestDetails({ sections: finalInitialRequestDetails });
        setIsLoading(false);
      };
      fetchRequestDetails();
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }, [team]);

  const onSubmit = async (data: RequestFormValues) => {
    try {
      if (!requestorProfile || !teamMember) return;

      setIsLoading(true);

      const response = data.sections[0].section_field[0]
        .field_response as string;

      const projectId = data.sections[0].section_field[0].field_option.find(
        (option) => option.option_value === response
      )?.option_id as string;

      if (!signerList.length) {
        notifications.show({
          title: "There's no assigned signer.",
          message: <InvalidSignerNotification />,
          color: "orange",
          autoClose: false,
        });
        return;
      }

      let request: RequestTableRow;
      if (isReferenceOnly) {
        request = await createRequest(supabaseClient, {
          requestFormValues: data,
          formId: form.form_id,
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
      } else {
        request = await editRequest(supabaseClient, {
          requestId,
          requestFormValues: data,
          signers: signerList,
          teamId: teamMember.team_member_team_id,
          requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
          formName: form.form_name,
          teamName: formatTeamNameToUrlKey(team.team_name ?? ""),
          userId: requestorProfile.user_id,
        });
      }

      notifications.show({
        message: `Request ${isReferenceOnly ? "created" : "edited"}.`,
        color: "green",
      });

      await router.push(
        `/${formatTeamNameToUrlKey(team.team_name ?? "")}/requests/${
          request.request_formsly_id_prefix
        }-${request.request_formsly_id_serial}`
      );
    } catch (erroer) {
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
          if (field.field_name === "Category") {
            return {
              ...field,
              field_section_duplicatable_id: sectionDuplicatableId,
              field_option: categoryOptions,
            };
          } else if (field.field_name === "Capacity Unit of Measure") {
            return {
              ...field,
              field_section_duplicatable_id: sectionDuplicatableId,
              field_option: unitOfMeasurementOptions,
            };
          } else {
            return {
              ...field,
              field_section_duplicatable_id: sectionDuplicatableId,
            };
          }
        }
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
            formId: form.form_id,
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

  const handleResetRequest = () => {
    replaceSection(initialRequestDetails ? initialRequestDetails.sections : []);
    handleProjectNameChange(
      initialRequestDetails?.sections[0].section_field[0]
        .field_response as string
    );
  };

  return (
    <Container>
      <Title order={2} color="dimmed">
        {isReferenceOnly ? "Create" : "Edit"} Request
      </Title>
      <Space h="xl" />
      <FormProvider {...requestFormMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
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
                    isEdit={!isReferenceOnly}
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
            <Flex direction="column" gap="sm">
              <Button
                variant="outline"
                color="red"
                onClick={handleResetRequest}
              >
                Reset
              </Button>
              <Button type="submit">Submit</Button>
            </Flex>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default EditPEDEquipmentRequestPage;
