import {
  getCurrentDate,
  getEquipmentDescription,
  getEquipmentName,
  getItemSectionChoices,
  getItemUnitOfMeasurement,
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
import { Box, Button, Container, Space, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import moment from "moment";
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
  categoryOptions: OptionTableRow[];
};

const CreateEquipmentServiceReportRequestPage = ({
  form,
  projectOptions,
  categoryOptions,
}: Props) => {
  const router = useRouter();
  const formId = router.query.formId as string;
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const requestorProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };

  const requestFormMethods = useForm<RequestFormValues>({ mode: "onChange" });
  const { handleSubmit, control, setValue, getValues, setFocus } =
    requestFormMethods;
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

  const [generalItemNameOptions, setGeneralItemNameOptions] = useState<
    OptionTableRow[]
  >([]);
  const [equipmentId, setEquipmentId] = useState("");
  const [isFetchingSigner, setIsFetchingSigner] = useState(false);
  const [signerList, setSignerList] = useState(
    form.form_signer.map((signer) => ({
      ...signer,
      signer_action: signer.signer_action.toUpperCase(),
    }))
  );
  const [actionPlanOptions, setActionPlanOptions] = useState<OptionTableRow[]>([
    {
      option_id: uuidv4(),
      option_value: "",
      option_order: 0,
      option_field_id: form.form_section[3].section_field[2].field_id,
    },
  ]);

  const [loadingFieldList, setLoadingFieldList] = useState<
    { sectionIndex: number; fieldIndex: number }[]
  >([]);

  const handleCreateRequest = async (data: RequestFormValues) => {
    if (isFetchingSigner) {
      notifications.show({
        message: "Wait until all signers are fetched before submitting.",
        color: "orange",
      });
      return;
    }
    try {
      if (!requestorProfile || !teamMember) return;

      setIsLoading(true);

      const response = data.sections[0].section_field[0]
        .field_response as string;
      const projectId = projectOptions.find(
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
        teamName: formatTeamNameToUrlKey(activeTeam.team_name ?? ""),
        userId: requestorProfile.user_id,
      });

      notifications.show({
        message: "Request created.",
        color: "green",
      });

      await router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name ?? "")}/requests/${
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
    if (!sectionMatch) return;

    if (sectionMatch.section_name === "Job Content") {
      setActionPlanOptions((prev) => [
        ...prev,
        {
          option_id: uuidv4(),
          option_value: "",
          option_order: actionPlanOptions.length,
          option_field_id: form.form_section[3].section_field[2].field_id,
        },
      ]);
    }

    const sectionDuplicatableId = uuidv4();
    const duplicatedFieldsWithDuplicatableId = sectionMatch.section_field.map(
      (field) => {
        if (field.field_name === "General Item Name") {
          return {
            ...field,
            field_section_duplicatable_id: sectionDuplicatableId,
            field_option: generalItemNameOptions,
          };
        } else if (field.field_name === "Action Plan") {
          return {
            ...field,
            field_section_duplicatable_id: sectionDuplicatableId,
            field_option: actionPlanOptions,
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
      section_order: sectionLastIndex + 1,
      section_field: duplicatedFieldsWithDuplicatableId,
    };

    insertSection(sectionLastIndex + 1, newSection);
    setTimeout(
      () =>
        setFocus(
          `sections.${sectionLastIndex + 1}.section_field.0.field_response`
        ),
      0
    );
    return;
  };

  const handleRemoveSection = (sectionDuplicatableId: string) => {
    const sectionMatchIndex = formSections.findIndex(
      (section) =>
        section.section_field[0].field_section_duplicatable_id ===
        sectionDuplicatableId
    );
    if (formSections[sectionMatchIndex].section_name === "Job Content") {
      const newActionPlanOption = actionPlanOptions
        .filter(
          (actionPlan) => actionPlan.option_order !== sectionMatchIndex - 2
        )
        .map((actionPlan, index) => {
          return { ...actionPlan, option_order: index };
        });
      setActionPlanOptions(newActionPlanOption);
      const sections = getValues("sections");
      const newSections = sections.map((section) => {
        if (section.section_name === "Resource Reference") {
          return {
            ...section,
            section_field: [
              ...section.section_field.slice(0, 2),
              {
                ...section.section_field[2],
                field_option: newActionPlanOption,
              },
              ...section.section_field.slice(3),
            ],
          };
        } else {
          return section;
        }
      });
      replaceSection(newSections);
    }
    if (sectionMatchIndex) {
      removeSection(sectionMatchIndex);
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

  useEffect(() => {
    replaceSection(form.form_section.slice(0, 4));
  }, [form, requestFormMethods]);

  const handleCategoryChange = async (value: string | null) => {
    const newSection = getValues(`sections.1`);
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: 1, fieldIndex: 2 }]);
        const categoryId = categoryOptions.find(
          (category) => category.option_value === value
        );
        if (!categoryId) return;
        const equipmentName = await getEquipmentName(supabaseClient, {
          category: categoryId.option_id,
        });

        const generalField = [
          ...newSection.section_field.slice(0, 2),
          {
            ...newSection.section_field[2],
            field_response: "",
            field_option: equipmentName.map((equipment, index) => {
              return {
                option_field_id: form.form_section[1].section_field[2].field_id,
                option_id: equipment.equipment_id,
                option_order: index,
                option_value: equipment.equipment_name,
              };
            }),
          },
          newSection.section_field[3],
          ...newSection.section_field.slice(4, 10).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
          ...newSection.section_field.slice(10),
        ];

        updateSection(1, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          ...newSection.section_field.slice(0, 2),
          {
            ...newSection.section_field[2],
            field_response: "",
            field_option: [],
          },
          newSection.section_field[3],
          ...newSection.section_field.slice(4, 10).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
          ...newSection.section_field.slice(10),
        ];
        updateSection(1, {
          ...newSection,
          section_field: generalField,
        });
      }
    } catch (e) {
      setValue(`sections.1.section_field.1.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleEquipmentTypeChange = async (value: string | null) => {
    const newSection = getValues(`sections.1`);
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: 0, fieldIndex: 4 }]);

        const equipmentOptions = newSection.section_field[2].field_option;
        const equipmentId = equipmentOptions.find(
          (equipment) => equipment.option_value === value
        );
        if (!equipmentId) return;

        const equipmentPropertyNumberOptions: OptionTableRow[] = [];
        let index = 0;
        while (1) {
          const propertyNumberData = await getPropertyNumberOptions(
            supabaseClient,
            {
              teamId: activeTeam.team_id,
              index,
              limit: FETCH_OPTION_LIMIT,
              equipmentId: equipmentId?.option_id,
              isWithAcquisitionDate: true,
            }
          );
          const propertyNumberOptions = propertyNumberData.map(
            (propertyNumber, index) => {
              return {
                option_field_id: form.form_section[1].section_field[4].field_id,
                option_id: propertyNumber.equipment_description_id,
                option_order: index,
                option_value:
                  propertyNumber.equipment_description_property_number_with_prefix,
              };
            }
          );
          equipmentPropertyNumberOptions.push(...propertyNumberOptions);

          if (propertyNumberData.length < FETCH_OPTION_LIMIT) break;
          index += FETCH_OPTION_LIMIT;
        }

        const generalField = [
          ...newSection.section_field.slice(0, 4),
          {
            ...newSection.section_field[4],
            field_response: "",
            field_option: equipmentPropertyNumberOptions,
          },
          ...newSection.section_field.slice(5, 10).map((field) => {
            return {
              ...field,
              field_response: "",
            };
          }),
          ...newSection.section_field.slice(10),
        ];

        const data = await getItemSectionChoices(supabaseClient, {
          equipmentId: equipmentId.option_id,
        });
        const equipmentGeneralNameChoices = data as unknown as {
          equipment_part_id: string;
          equipment_general_name: string;
        }[];

        setEquipmentId(equipmentId.option_id);

        const generalItemNameOption = equipmentGeneralNameChoices.map(
          (choice, index) => {
            return {
              option_field_id: form.form_section[4].section_field[0].field_id,
              option_id: choice.equipment_part_id,
              option_order: index,
              option_value: choice.equipment_general_name,
            };
          }
        );
        setGeneralItemNameOptions(generalItemNameOption);

        const newSections = formSections.map((section) => {
          if (section.section_name === "Item") {
            return {
              ...section,
              section_field: [
                {
                  ...section.section_field[0],
                  field_option: generalItemNameOption,
                },
                ...section.section_field.slice(1),
              ],
            };
          } else if (section.section_name === "Equipment") {
            return {
              ...newSection,
              section_field: generalField,
            };
          } else {
            return section;
          }
        });
        replaceSection(newSections);
      } else {
        const generalField = [
          ...newSection.section_field.slice(0, 4),
          ...newSection.section_field.slice(4, 10).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
          ...newSection.section_field.slice(10),
        ];
        updateSection(1, {
          ...newSection,
          section_field: generalField,
        });
        setEquipmentId("");
        setGeneralItemNameOptions([]);
      }
    } catch (e) {
      setValue(`sections.1.section_field.2.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handlePropertyNumberChange = async (value: string | null) => {
    const newSection = getValues(`sections.1`);
    try {
      if (value) {
        setLoadingFieldList([
          { sectionIndex: 0, fieldIndex: 5 },
          { sectionIndex: 0, fieldIndex: 6 },
          { sectionIndex: 0, fieldIndex: 7 },
          { sectionIndex: 0, fieldIndex: 8 },
          { sectionIndex: 0, fieldIndex: 9 },
        ]);
        const equipmentDescription = await getEquipmentDescription(
          supabaseClient,
          {
            propertyNumber: value,
          }
        );
        const currentDate = await getCurrentDate(supabaseClient);
        3;

        const yearsOwned =
          moment(currentDate).year() -
          Number(equipmentDescription.equipment_description_acquisition_date);
        const a = 50 - (yearsOwned > 12 ? 12 : yearsOwned) * (50 / 12);
        const b = 50 / Number(newSection.section_field[3].field_response);

        const totalPriority = `${(a + b).toFixed(2)}%`;

        const generalField = [
          ...newSection.section_field.slice(0, 5),
          {
            ...newSection.section_field[5],
            field_response:
              equipmentDescription.equipment_description_brand.equipment_brand,
          },
          {
            ...newSection.section_field[6],
            field_response:
              equipmentDescription.equipment_description_model.equipment_model,
          },
          {
            ...newSection.section_field[7],
            field_response:
              equipmentDescription.equipment_description_serial_number,
          },
          {
            ...newSection.section_field[8],
            field_response:
              equipmentDescription.equipment_description_acquisition_date,
          },
          {
            ...newSection.section_field[9],
            field_response: totalPriority,
          },
          ...newSection.section_field.slice(10),
        ];

        updateSection(1, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          ...newSection.section_field.slice(0, 5),
          ...newSection.section_field.slice(5, 10).map((field) => {
            return {
              ...field,
              field_response: "",
            };
          }),
          ...newSection.section_field.slice(10),
        ];
        updateSection(1, {
          ...newSection,
          section_field: generalField,
        });
      }
    } catch (e) {
      setValue(`sections.0.section_field.4.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleActionTypeChange = async (
    value: string | null,
    prevValue: string | null
  ) => {
    try {
      if (value === "Labor and Parts") {
        setLoadingFieldList([{ sectionIndex: 1, fieldIndex: 12 }]);
        insertSection(
          formSections.length,
          {
            ...form.form_section[4],
            section_field: [
              {
                ...form.form_section[4].section_field[0],
                field_option: generalItemNameOptions,
              },
              ...form.form_section[4].section_field.slice(1),
            ],
          },
          { shouldFocus: false }
        );
        setTimeout(
          () => setFocus(`sections.${2}.section_field.0.field_response`),
          0
        );
      } else if (prevValue === "Labor and Parts") {
        const newSections = formSections.filter(
          (section) => section.section_name !== "Item"
        );
        replaceSection(newSections);
      }
    } catch (e) {
      setValue(`sections.1.section_field.12.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleActionPlanBlur = async (value: string | null, index: number) => {
    const sections = getValues("sections");
    try {
      const jobContentIndex = index - 2;
      const newActionPlanOption = actionPlanOptions;
      actionPlanOptions[jobContentIndex].option_value = value ?? "";
      setActionPlanOptions(newActionPlanOption);

      const newSections = sections.map((section) => {
        if (section.section_name === "Resource Reference") {
          return {
            ...section,
            section_field: [
              ...section.section_field.slice(0, 2),
              {
                ...section.section_field[2],
                field_option: newActionPlanOption,
              },
              ...section.section_field.slice(3),
            ],
          };
        } else {
          return section;
        }
      });
      replaceSection(newSections);
    } catch (e) {
      setValue(`sections.1.section_field.12.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleGeneralItemNameChange = async (
    value: string | null,
    index: number
  ) => {
    const newSection = getValues(`sections.${index}`);
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: index, fieldIndex: 1 }]);
        const data = await getItemSectionChoices(supabaseClient, {
          equipmentId: equipmentId,
          generalName: value,
        });

        const equipmentComponentCategoryChoices = data as unknown as {
          equipment_part_id: string;
          equipment_component_category: string;
        }[];

        const componentCategoryOption = equipmentComponentCategoryChoices.map(
          (choice, index) => {
            return {
              option_field_id: form.form_section[4].section_field[1].field_id,
              option_id: choice.equipment_part_id,
              option_order: index,
              option_value: choice.equipment_component_category,
            };
          }
        );

        const generalField = [
          newSection.section_field[0],
          {
            ...newSection.section_field[1],
            field_option: componentCategoryOption,
            field_response: "",
          },
          ...newSection.section_field.slice(2).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          newSection.section_field[0],
          ...newSection.section_field.slice(1).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
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

  const handleComponentCategoryChange = async (
    value: string | null,
    index: number
  ) => {
    const newSection = getValues(`sections.${index}`);
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: index, fieldIndex: 2 }]);
        const data = await getItemSectionChoices(supabaseClient, {
          equipmentId: equipmentId,
          generalName: newSection.section_field[0].field_response as string,
          componentCategory: value,
        });
        const brandOptionChoices = data as unknown as {
          equipment_part_id: string;
          equipment_brand: string;
        }[];

        const brandOption = brandOptionChoices.map((choice, index) => {
          return {
            option_field_id: form.form_section[4].section_field[2].field_id,
            option_id: choice.equipment_part_id,
            option_order: index,
            option_value: choice.equipment_brand,
          };
        });

        const generalField = [
          ...newSection.section_field.slice(0, 2),
          {
            ...newSection.section_field[2],
            field_option: brandOption,
            field_response: "",
          },
          ...newSection.section_field.slice(3).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          ...newSection.section_field.slice(0, 2),
          ...newSection.section_field.slice(2).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.${1}.field_response`, "");
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

        const data = await getItemSectionChoices(supabaseClient, {
          equipmentId: equipmentId,
          generalName: newSection.section_field[0].field_response as string,
          componentCategory: newSection.section_field[1]
            .field_response as string,
          brand: value,
        });
        const modelOptionChoices = data as unknown as {
          equipment_part_id: string;
          equipment_model: string;
        }[];

        const modelOption = modelOptionChoices.map((choice, index) => {
          return {
            option_field_id: form.form_section[4].section_field[3].field_id,
            option_id: choice.equipment_part_id,
            option_order: index,
            option_value: choice.equipment_model,
          };
        });

        const generalField = [
          ...newSection.section_field.slice(0, 3),
          {
            ...newSection.section_field[3],
            field_option: modelOption,
            field_response: "",
          },
          ...newSection.section_field.slice(4).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          ...newSection.section_field.slice(0, 3),
          ...newSection.section_field.slice(3).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.${2}.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleModelChange = async (value: string | null, index: number) => {
    const newSection = getValues(`sections.${index}`);
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: index, fieldIndex: 4 }]);
        const data = await getItemSectionChoices(supabaseClient, {
          equipmentId: equipmentId,
          generalName: newSection.section_field[0].field_response as string,
          componentCategory: newSection.section_field[1]
            .field_response as string,
          brand: newSection.section_field[2].field_response as string,
          model: value,
        });
        const partNumberOptionChoices = data as unknown as {
          equipment_part_id: string;
          equipment_part_number: string;
        }[];

        const partNumberOption = partNumberOptionChoices.map(
          (choice, index) => {
            return {
              option_field_id: form.form_section[4].section_field[4].field_id,
              option_id: choice.equipment_part_id,
              option_order: index,
              option_value: choice.equipment_part_number,
            };
          }
        );

        const generalField = [
          ...newSection.section_field.slice(0, 4),
          {
            ...newSection.section_field[4],
            field_option: partNumberOption,
            field_response: "",
          },
          ...newSection.section_field.slice(5).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          ...newSection.section_field.slice(0, 4),
          ...newSection.section_field.slice(4).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.${3}.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handlePartNumberChange = async (
    value: string | null,
    index: number
  ) => {
    const newSection = getValues(`sections.${index}`);
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: index, fieldIndex: 6 }]);
        const equipmentPartUoM = await getItemUnitOfMeasurement(
          supabaseClient,
          {
            generalName: newSection.section_field[0].field_response as string,
            componentCategory: newSection.section_field[1]
              .field_response as string,
            brand: newSection.section_field[2].field_response as string,
            model: newSection.section_field[3].field_response as string,
            partNumber: value,
          }
        );

        const generalField = [
          ...newSection.section_field.slice(0, 6),
          {
            ...newSection.section_field[6],
            field_response: equipmentPartUoM,
          },
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      } else {
        const generalField = [
          ...newSection.section_field.slice(0, 5),
          ...newSection.section_field.slice(5).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
            };
          }),
        ];
        updateSection(index, {
          ...newSection,
          section_field: generalField,
        });
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.${4}.field_response`, "");
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
                    loadingFieldList={loadingFieldList}
                    equipmentServiceReportMethods={{
                      onProjectNameChange: handleProjectNameChange,
                      onCategoryChange: handleCategoryChange,
                      onEquipmentTypeChange: handleEquipmentTypeChange,
                      onPropertyNumberChange: handlePropertyNumberChange,
                      onActionTypeChange: handleActionTypeChange,
                      onActionPlanBlur: handleActionPlanBlur,
                      onGeneralItemNameChange: handleGeneralItemNameChange,
                      onComponentCategoryChange: handleComponentCategoryChange,
                      onBrandChange: handleBrandChange,
                      onModelChange: handleModelChange,
                      onPartNumberChange: handlePartNumberChange,
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
            <RequestFormSigner signerList={signerList} />
            <Button type="submit" disabled={Boolean(loadingFieldList.length)}>
              Submit
            </Button>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default CreateEquipmentServiceReportRequestPage;
