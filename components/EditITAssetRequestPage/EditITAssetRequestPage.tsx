import {
  getCSICode,
  getCSICodeOptions,
  getITAssetItemOptions,
  getItem,
  getItemRequestConditionalOptions,
  getLevelThreeDescription,
  getNonDuplictableSectionResponse,
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
  CSICodeTableRow,
  FormType,
  FormWithResponseType,
  ItemWithDescriptionAndField,
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
  duplicatableSectionIdList: string[];
  requestId: string;
};

const EditITAssetRequestPage = ({
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
  const [itemOptions, setItemOptions] = useState<OptionTableRow[]>([]);
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
    form_type: form.form_type,
    form_sub_type: form.form_sub_type,
  };

  const requestFormMethods = useForm<RequestFormValues>({ mode: "onChange" });
  const { handleSubmit, control, setValue, unregister, getValues } =
    requestFormMethods;
  const {
    fields: formSections,
    insert: addSection,
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
        // Fetch item option
        let index = 0;
        const itemOptionList: OptionTableRow[] = [];
        while (1) {
          const itemData = await getITAssetItemOptions(supabaseClient, {
            teamId: team.team_id,
            index,
            limit: FETCH_OPTION_LIMIT,
          });
          const itemOptions = itemData.map((item, index) => {
            return {
              option_field_id: form.form_section[1].section_field[0].field_id,
              option_id: item.item_id,
              option_order: index,
              option_value: item.item_general_name,
            };
          });
          itemOptionList.push(...itemOptions);

          if (itemData.length < FETCH_OPTION_LIMIT) break;
          index += FETCH_OPTION_LIMIT;
        }
        setItemOptions(itemOptionList);

        // Fetch response
        // Non duplicatable section response
        const nonDuplicatableSectionResponse1 =
          await getNonDuplictableSectionResponse(supabaseClient, {
            requestId,
            fieldIdList: form.form_section[0].section_field.map(
              (field) => field.field_id
            ),
          });
        const nonDuplicatableSectionField1 =
          form.form_section[0].section_field.map((field) => {
            const response = nonDuplicatableSectionResponse1.find(
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

        const nonDuplicatableSectionResponse2 =
          await getNonDuplictableSectionResponse(supabaseClient, {
            requestId,
            fieldIdList: form.form_section[2].section_field.map(
              (field) => field.field_id
            ),
          });
        const nonDuplicatableSectionField2 =
          form.form_section[2].section_field.map((field) => {
            const response = nonDuplicatableSectionResponse2.find(
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
                option = itemOptionList;
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

        // Filter section with unique item name
        const uniqueItemName: string[] = [];
        const filteredSection: RequestFormValues["sections"] = [];
        formattedSection.forEach((section) => {
          if (
            !uniqueItemName.includes(
              `${section.section_field[0].field_response}`
            )
          ) {
            uniqueItemName.push(`${section.section_field[0].field_response}`);
            filteredSection.push(section);
          }
        });

        // Fetch conditional options
        const conditionalOptionList: {
          itemName: string;
          fieldList: {
            fieldId: string;
            optionList: OptionTableRow[];
          }[];
        }[] = [];

        index = 0;
        while (1) {
          const optionData = await getItemRequestConditionalOptions(
            supabaseClient,
            {
              sectionList: filteredSection
                .slice(index, index + 5)
                .map((section) => {
                  return {
                    itemName: `${section.section_field[0].field_response}`,
                    fieldIdList: [
                      section.section_field[4].field_id,
                      ...section.section_field
                        .slice(9)
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
          const itemIndex = conditionalOptionList.findIndex(
            (value) =>
              value.itemName === section.section_field[0].field_response
          );
          if (itemIndex === -1) return;

          conditionalOptionList[itemIndex].fieldList.forEach((field) => {
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
        handleProjectNameChange(nonDuplicatableSectionField1[0].field_response);

        const finalInitialRequestDetails = [
          {
            ...form.form_section[0],
            section_field: nonDuplicatableSectionField1,
          },
          ...sectionWithDuplicatableId,
          {
            ...form.form_section[2],
            section_field: nonDuplicatableSectionField2,
          },
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
    if (isFetchingSigner) {
      notifications.show({
        message: "Wait until all signers are fetched before submitting.",
        color: "orange",
      });
      return;
    }
    try {
      if (!requestorProfile) return;
      if (!teamMember) return;

      setIsLoading(true);

      const response = data.sections[0].section_field[0]
        .field_response as string;

      const projectId = data.sections[0].section_field[0].field_option.find(
        (option) => option.option_value === response
      )?.option_id as string;

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
        });
      }

      notifications.show({
        message: `Request ${isReferenceOnly ? "created" : "edited"}.`,
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

  const handleResetRequest = () => {
    unregister(`sections.${0}`);
    replaceSection(initialRequestDetails ? initialRequestDetails.sections : []);
    handleProjectNameChange(
      initialRequestDetails?.sections[0].section_field[0]
        .field_response as string
    );
  };

  const handleCSICodeChange = async (index: number, value: string | null) => {
    const newSection = getValues(`sections.${index}`);

    try {
      if (value) {
        setLoadingFieldList([
          { sectionIndex: index, fieldIndex: 5 },
          { sectionIndex: index, fieldIndex: 6 },
          { sectionIndex: index, fieldIndex: 7 },
          { sectionIndex: index, fieldIndex: 8 },
        ]);
        const csiCode = await getCSICode(supabaseClient, { csiCode: value });

        const generalFieldListWithUpdatedCsiField =
          newSection.section_field.map((field, fieldIndex) => {
            switch (fieldIndex) {
              case 5:
                field.field_response = csiCode?.csi_code_section;
                break;

              case 6:
                field.field_response = csiCode?.csi_code_division_description;
                break;

              case 7:
                field.field_response =
                  csiCode?.csi_code_level_two_major_group_description;
                break;

              case 8:
                field.field_response =
                  csiCode?.csi_code_level_two_minor_group_description;
                break;

              default:
                break;
            }

            return field;
          });

        updateSection(index, {
          ...newSection,
          section_field: generalFieldListWithUpdatedCsiField,
        });
      } else {
        const newSectionWithCsiFieldNoResponse = newSection.section_field.map(
          (field, fieldIndex) => {
            if (fieldIndex > 4 && fieldIndex <= 8) {
              return {
                ...field,
                field_response: "",
              };
            }
            return field;
          }
        );
        updateSection(index, {
          ...newSection,
          section_field: newSectionWithCsiFieldNoResponse,
        });
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.4.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
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
          if (field.field_name === "General Name") {
            return {
              ...field,
              field_section_duplicatable_id: sectionDuplicatableId,
              field_option: itemOptions,
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
    }
  };

  const handleGeneralNameChange = async (
    index: number,
    value: string | null
  ) => {
    const newSection = getValues(`sections.${index}`);
    try {
      if (value) {
        setLoadingFieldList([
          { sectionIndex: index, fieldIndex: 1 },
          { sectionIndex: index, fieldIndex: 3 },
          { sectionIndex: index, fieldIndex: 4 },
        ]);
        const item = await getItem(supabaseClient, {
          teamId: team.team_id,
          itemName: value,
        });
        const isWithDescription = Boolean(item.item_level_three_description);
        const csiCodeList = await fetchCSIOptions({
          itemWithLevelThreeDescription: item.item_level_three_description,
          itemDivisionIdList: item.item_division_id_list,
        });
        const generalField = [
          { ...newSection.section_field[0] },
          { ...newSection.section_field[1], field_response: item.item_unit },
          { ...newSection.section_field[2] },
          {
            ...newSection.section_field[3],
            field_response: item.item_gl_account,
          },
          {
            ...newSection.section_field[4],
            field_response: isWithDescription
              ? csiCodeList[0].csi_code_level_three_description
              : "",
            field_option: csiCodeList.map((csiCode, index) => ({
              option_field_id: form.form_section[0].section_field[0].field_id,
              option_id: csiCode.csi_code_id,
              option_order: index,
              option_value: csiCode.csi_code_level_three_description,
            })),
          },
          ...newSection.section_field.slice(5, 8).map((field) => {
            if (isWithDescription) {
              switch (field.field_name) {
                case "CSI Code":
                  return {
                    ...field,
                    field_response: csiCodeList[0].csi_code_section,
                  };
                case "Division Description":
                  return {
                    ...field,
                    field_response:
                      csiCodeList[0].csi_code_division_description,
                  };
                case "Level 2 Major Group Description":
                  return {
                    ...field,
                    field_response:
                      csiCodeList[0].csi_code_level_two_major_group_description,
                  };
                case "Level 2 Minor Group Description":
                  return {
                    ...field,
                    field_response:
                      csiCodeList[0].csi_code_level_two_minor_group_description,
                  };
                default:
                  return { ...field, field_response: "" };
              }
            } else {
              return { ...field, field_response: "" };
            }
          }),
        ];
        const duplicatableSectionId = index === 1 ? undefined : uuidv4();

        if (value.toLowerCase() === "ink") {
          generalField.push(form.form_section[1].section_field[9]);
        }
        const newFields = item.item_description.map((description) => {
          const options = description.item_description_field.map(
            (options, optionIndex) => ({
              option_field_id: description.item_field.field_id,
              option_id: options.item_description_field_id,
              option_order: optionIndex + 1,
              option_value: `${options.item_description_field_value}${
                description.item_description_is_with_uom
                  ? ` ${options.item_description_field_uom[0].item_description_field_uom}`
                  : ""
              }`,
            })
          );
          const index = options.findIndex(
            (value) => value.option_value === "Any"
          );
          if (index !== -1) {
            const anyOption = options[index];
            options.splice(index, 1);
            options.unshift({ ...anyOption });
          }
          return {
            ...description.item_field,
            field_section_duplicatable_id: duplicatableSectionId,
            field_option: options,
            field_response: index !== -1 ? "Any" : "",
          };
        });
        updateSection(index, {
          ...newSection,
          section_field: [
            ...generalField.map((field) => ({
              ...field,
              field_section_duplicatable_id: duplicatableSectionId,
            })),
            ...newFields,
          ],
        });
      } else {
        const generalField = [
          newSection.section_field[0],
          { ...newSection.section_field[1], field_response: "" },
          newSection.section_field[2],
          ...newSection.section_field.slice(3, 8).map((field) => ({
            ...field,
            field_response: "",
            field_option: [],
          })),
          newSection.section_field[8],
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.0.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const fetchCSIOptions = async ({
    itemWithLevelThreeDescription,
    itemDivisionIdList,
  }: {
    itemWithLevelThreeDescription: string | undefined;
    itemDivisionIdList: ItemWithDescriptionAndField["item_division_id_list"];
  }) => {
    let csiCodeList: CSICodeTableRow[] = [];
    if (itemWithLevelThreeDescription) {
      csiCodeList = await getLevelThreeDescription(supabaseClient, {
        levelThreeDescription: itemWithLevelThreeDescription,
      });
    } else {
      let index = 0;
      const csiOptionList: CSICodeTableRow[] = [];
      while (true) {
        const csiData = await getCSICodeOptions(supabaseClient, {
          index,
          limit: FETCH_OPTION_LIMIT,
          divisionIdList: itemDivisionIdList,
        });
        csiOptionList.push(...(csiData as CSICodeTableRow[]));
        if (csiData.length < FETCH_OPTION_LIMIT) break;
        index += FETCH_OPTION_LIMIT;
      }
      csiCodeList = csiOptionList;
    }
    return csiCodeList;
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
                    itAssetRequestFormMethods={{
                      onProjectNameChange: handleProjectNameChange,
                      onGeneralNameChange: handleGeneralNameChange,
                      onCSICodeChange: handleCSICodeChange,
                    }}
                    formslyFormName={form.form_name}
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
            <RequestFormSigner signerList={signerList} />
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

export default EditITAssetRequestPage;
