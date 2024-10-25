import {
  getEquipmentDescription,
  getItem,
  getPedItemOptions,
  getProjectSignerWithTeamMember,
  getPropertyNumberOptions,
} from "@/backend/api/get";
import { createRequest } from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import RequestFormSigner from "@/components/CreateRequestPage/RequestFormSigner";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { FETCH_OPTION_LIMIT } from "@/utils/constant";
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
};

const CreatePEDItemRequestPage = ({ form, projectOptions }: Props) => {
  const router = useRouter();
  const formId = router.query.formId as string;
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const team = useActiveTeam();
  const requestorProfile = useUserProfile();

  const optionalFields = form.form_section[1].section_field
    .slice(0, 4)
    .map((field) => {
      return {
        ...field,
        field_response: "",
      };
    });

  const [signerList, setSignerList] = useState(
    form.form_signer.map((signer) => ({
      ...signer,
      signer_action: signer.signer_action.toUpperCase(),
    }))
  );
  const [isFetchingSigner, setIsFetchingSigner] = useState(false);
  const [itemOptions, setItemOptions] = useState<OptionTableRow[]>([]);
  const [propertyNumberOptions, setPropertyNumberOptions] = useState<
    OptionTableRow[]
  >([]);
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
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        if (!team.team_id) return;
        let index = 0;
        const itemOptionList: OptionTableRow[] = [];
        while (1) {
          const itemData = await getPedItemOptions(supabaseClient, {
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
        index = 0;
        const propertyNumberOptionList: OptionTableRow[] = [];
        while (1) {
          const propertyNumberData = await getPropertyNumberOptions(
            supabaseClient,
            {
              teamId: team.team_id,
              index,
              limit: FETCH_OPTION_LIMIT,
            }
          );
          const propertyNumberOptions = propertyNumberData.map(
            (propertyNumber, index) => {
              return {
                option_field_id: form.form_section[1].section_field[0].field_id,
                option_id: propertyNumber.equipment_description_id,
                option_order: index,
                option_value:
                  propertyNumber.equipment_description_property_number_with_prefix,
              };
            }
          );
          propertyNumberOptionList.push(...propertyNumberOptions);

          if (propertyNumberData.length < FETCH_OPTION_LIMIT) break;
          index += FETCH_OPTION_LIMIT;
        }
        setPropertyNumberOptions(propertyNumberOptionList);

        replaceSection([
          form.form_section[0],
          {
            ...form.form_section[1],
            section_field: [
              {
                ...form.form_section[1].section_field[0],
                field_option: propertyNumberOptionList,
              },
              ...form.form_section[1].section_field.slice(1, 4),
              {
                ...form.form_section[1].section_field[4],
                field_option: itemOptionList,
              },
              ...form.form_section[1].section_field.slice(5),
            ],
          },
        ]);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOptions();
  }, [team]);

  const handleCreateRequest = async (data: RequestFormValues) => {
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
    const isBulk =
      getValues(`sections.0.section_field.2.field_response`) === "Bulk";
    const sectionLastIndex = formSections
      .map((sectionItem) => sectionItem.section_id)
      .lastIndexOf(sectionId);
    const sectionMatch = form.form_section.find(
      (section) => section.section_id === sectionId
    );
    if (sectionMatch) {
      const sectionDuplicatableId = uuidv4();
      const duplicatedFieldsWithDuplicatableId = sectionMatch.section_field
        .slice(isBulk ? 4 : 0)
        .map((field) => {
          if (field.field_name === "General Name") {
            return {
              ...field,
              field_section_duplicatable_id: sectionDuplicatableId,
              field_option: itemOptions,
            };
          } else if (field.field_name === "Equipment Property Number") {
            return {
              ...field,
              field_section_duplicatable_id: sectionDuplicatableId,
              field_option: propertyNumberOptions,
            };
          }

          return {
            ...field,
            field_section_duplicatable_id: sectionDuplicatableId,
          };
        });
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

  const handlePropertyNumberChange = async (
    value: string | null,
    index: number
  ) => {
    const newSection = getValues(`sections.${index}`);
    try {
      if (value) {
        setLoadingFieldList([
          { sectionIndex: index, fieldIndex: 1 },
          { sectionIndex: index, fieldIndex: 2 },
          { sectionIndex: index, fieldIndex: 3 },
        ]);
        const equipmentDescription = await getEquipmentDescription(
          supabaseClient,
          {
            propertyNumber: value,
          }
        );
        const generalField = [
          newSection.section_field[0],
          {
            ...newSection.section_field[1],
            field_response:
              equipmentDescription.equipment_description_brand
                .equipment_brand ?? "",
          },
          {
            ...newSection.section_field[2],
            field_response:
              equipmentDescription.equipment_description_model
                .equipment_model ?? "",
          },
          {
            ...newSection.section_field[3],
            field_response:
              equipmentDescription.equipment_description_serial_number,
          },
          ...newSection.section_field.slice(4),
        ];

        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          newSection.section_field[0],
          ...newSection.section_field.slice(1, 4).map((field) => {
            return {
              ...field,
              field_response: "",
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

  const handleRequestTypeChange = async (
    prevValue: string | null,
    value: string | null
  ) => {
    const sectionList = getValues(`sections`).slice(1);
    try {
      if (value === "Bulk") {
        sectionList.forEach((section, index) => {
          const generalField = [...section.section_field.slice(4)];
          removeSection(index + 1);
          updateSection(index + 1, {
            ...section,
            section_field: generalField,
          });
        });
      } else if (prevValue === "Bulk") {
        sectionList.forEach((section, index) => {
          const generalField = [
            { ...optionalFields[0], field_option: propertyNumberOptions },
            ...optionalFields.slice(1),
            ...section.section_field,
          ];
          updateSection(index + 1, {
            ...section,
            section_field: generalField,
          });
        });
      }
    } catch (e) {
      setValue(`sections.0.section_field.${2}.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleGeneralNameChange = async (
    value: string | null,
    index: number
  ) => {
    const newSection = getValues(`sections.${index}`);
    const isBulk =
      getValues(`sections.0.section_field.2.field_response`) === "Bulk";
    try {
      if (value) {
        setLoadingFieldList([
          { sectionIndex: index, fieldIndex: isBulk ? 1 : 5 },
        ]);
        const item = await getItem(supabaseClient, {
          teamId: team.team_id,
          itemName: value,
        });

        let generalField: Section["section_field"] = [];
        if (isBulk) {
          generalField = [
            newSection.section_field[0],
            {
              ...newSection.section_field[1],
              field_response: item.item_unit,
            },
            newSection.section_field[2],
          ];
        } else {
          generalField = [
            ...newSection.section_field.slice(0, 5),
            {
              ...newSection.section_field[5],
              field_response: item.item_unit,
            },
            newSection.section_field[6],
          ];
        }

        const duplicatableSectionId = index === 1 ? undefined : uuidv4();

        const newFields = item.item_description.map((description) => {
          const options = description.item_description_field.map(
            (options, optionIndex) => {
              return {
                option_field_id: description.item_field.field_id,
                option_id: options.item_description_field_id,
                option_order: optionIndex + 1,
                option_value: `${options.item_description_field_value}${
                  description.item_description_is_with_uom
                    ? ` ${options.item_description_field_uom[0].item_description_field_uom}`
                    : ""
                }`,
              };
            }
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
            ...generalField.map((field) => {
              return {
                ...field,
                field_section_duplicatable_id: duplicatableSectionId,
              };
            }),
            ...newFields,
          ],
        });
      } else {
        let generalField: Section["section_field"] = [];
        if (isBulk) {
          generalField = [
            newSection.section_field[0],
            {
              ...newSection.section_field[1],
              field_response: "",
            },
            newSection.section_field[2],
          ];
        } else {
          generalField = [
            ...newSection.section_field.slice(0, 5),
            {
              ...newSection.section_field[5],
              field_response: "",
            },
            newSection.section_field[6],
          ];
        }
        updateSection(index, {
          ...newSection,
          section_field: generalField,
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
                    pedItemFormMethods={{
                      onProjectNameChange: handleProjectNameChange,
                      onPropertyNumberChange: handlePropertyNumberChange,
                      onRequestTypeChange: handleRequestTypeChange,
                      onGeneralNameChange: handleGeneralNameChange,
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

export default CreatePEDItemRequestPage;
