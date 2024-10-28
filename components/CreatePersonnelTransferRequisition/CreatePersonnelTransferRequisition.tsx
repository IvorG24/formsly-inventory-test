import {
  getEmployeeName,
  getEmployeePositionOptions,
  getEquipmentCodeOptions,
  getEquipmentDescription,
  getEquipmentUnitOptions,
  getProjectSignerWithTeamMember,
  getTeamDepartmentOptions,
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

const CreatePersonnelTransferRequisition = ({
  form,
  projectOptions: initialProjectOption,
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

  const [projectDepartmentOptions, setProjectDepartmentOptions] = useState<
    OptionTableRow[]
  >([]);
  const [projectOptions, setProjectOptions] = useState<OptionTableRow[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<OptionTableRow[]>(
    []
  );
  const [equipmentCodeOptions, setEquipmentCodeOptions] = useState<
    OptionTableRow[]
  >([]);
  const [equipmentUnitOptions, setEquipmentUnitOptions] = useState<
    OptionTableRow[]
  >([]);
  const [isFetchingSigner, setIsFetchingSigner] = useState(false);
  const [signerList, setSignerList] = useState(
    form.form_signer.map((signer) => ({
      ...signer,
      signer_action: signer.signer_action.toUpperCase(),
    }))
  );
  const [signerFromList, setSignerFromList] = useState<FormType["form_signer"]>(
    []
  );
  const [signerToList, setSignerToList] = useState<FormType["form_signer"]>([]);

  const [loadingFieldList, setLoadingFieldList] = useState<
    { sectionIndex: number; fieldIndex: number }[]
  >([]);

  useEffect(() => {
    const teamMemberIdList: string[] = [];
    const newSignerList: FormType["form_signer"] = [];
    [...signerFromList, ...signerToList].forEach((signer) => {
      if (
        !teamMemberIdList.includes(signer.signer_team_member.team_member_id)
      ) {
        newSignerList.push(signer);
        teamMemberIdList.push(signer.signer_team_member.team_member_id);
      }
    });
    setSignerList(newSignerList);
  }, [signerFromList, signerToList]);

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

      const response = data.sections[1].section_field[1]
        .field_response as string;
      const projectId = initialProjectOption.find(
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

    if (
      [
        "Equipment",
        "Employee",
        "Asset Information",
        "Replacement / Reliever",
        "Employee with Equipment",
      ].includes(sectionMatch.section_name)
    ) {
      const isLimit =
        formSections.filter(
          (section) => section.section_name === sectionMatch.section_name
        ).length === 15;
      if (isLimit) {
        notifications.show({
          message: `The ${sectionMatch.section_name} section has reached its limit.`,
          color: "orange",
        });
        return;
      }
    }

    const sectionDuplicatableId = uuidv4();
    const duplicatedFieldsWithDuplicatableId = sectionMatch.section_field.map(
      (field) => {
        if (field.field_name === "Equipment Code") {
          return {
            ...field,
            field_section_duplicatable_id: sectionDuplicatableId,
            field_option: equipmentCodeOptions,
          };
        } else if (field.field_name === "Unit") {
          return {
            ...field,
            field_section_duplicatable_id: sectionDuplicatableId,
            field_option: equipmentUnitOptions,
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
    if (sectionMatchIndex) {
      removeSection(sectionMatchIndex);
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        if (!activeTeam.team_id) return;
        // fetch department options
        let index = 0;
        const departmentOptionList: OptionTableRow[] = [];
        while (1) {
          const departmentData = await getTeamDepartmentOptions(
            supabaseClient,
            {
              index,
              limit: FETCH_OPTION_LIMIT,
            }
          );
          const departmentOptions = departmentData.map((department, index) => {
            return {
              option_field_id: form.form_section[1].section_field[3].field_id,
              option_id: department.team_department_id,
              option_order: index,
              option_value: department.team_department_name,
            };
          });
          departmentOptionList.push(...departmentOptions);

          if (departmentData.length < FETCH_OPTION_LIMIT) break;
          index += FETCH_OPTION_LIMIT;
        }
        setProjectDepartmentOptions(departmentOptionList);

        // separate project to department
        const teamProjectOptionList: OptionTableRow[] = [];
        const teamDepartmentOptionList: OptionTableRow[] = [];
        initialProjectOption.forEach((project) => {
          if (project.option_value.includes("CENTRAL OFFICE")) {
            teamDepartmentOptionList.push(project);
          } else if (!project.option_value.includes("YARD")) {
            teamProjectOptionList.push(project);
          }
        });
        setProjectOptions(teamProjectOptionList);
        setDepartmentOptions(teamDepartmentOptionList);

        replaceSection([
          form.form_section[0],
          {
            ...form.form_section[1],
            section_field: [
              ...form.form_section[1].section_field.slice(0, 3),
              {
                ...form.form_section[1].section_field[3],
                field_option: departmentOptionList,
              },
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
  }, [activeTeam]);

  const handleTypeOfTransferChange = async (value: string | null) => {
    const currentSection = getValues(`sections.0`);
    const headerSection = getValues(`sections.1`);

    try {
      replaceSection([currentSection, headerSection]);
      if (value) {
        setLoadingFieldList([{ sectionIndex: 0, fieldIndex: 0 }]);
        if (value === "Person") {
          // fetch position options
          let index = 0;
          const positionOptionList: OptionTableRow[] = [];
          while (1) {
            const positionOptionData = await getEmployeePositionOptions(
              supabaseClient,
              {
                index,
                limit: FETCH_OPTION_LIMIT,
              }
            );
            const positionOptions = positionOptionData.map(
              (position, index) => {
                return {
                  option_field_id:
                    form.form_section[6].section_field[0].field_id,
                  option_id: position.employee_job_title_id,
                  option_order: index,
                  option_value: position.employee_job_title_label,
                };
              }
            );
            positionOptionList.push(...positionOptions);

            if (positionOptionData.length < FETCH_OPTION_LIMIT) break;
            index += FETCH_OPTION_LIMIT;
          }

          replaceSection([
            currentSection,
            {
              ...headerSection,
              section_field: [
                ...headerSection.section_field.slice(0, 4),
                // add purpose onward field
                ...form.form_section[1].section_field.slice(4),
              ],
            },
            // add employee section
            form.form_section[3],
            // add content section
            {
              ...form.form_section[6],
              section_field: [
                {
                  ...form.form_section[6].section_field[0],
                  field_option: positionOptionList,
                },
                ...form.form_section[6].section_field.slice(1, 4),
                ...form.form_section[6].section_field.slice(5, 6),
              ],
            },
          ]);
        } else if (value === "Equipment") {
          // fetch equipment code options
          let index = 0;
          const equipmentCodeOptionList: OptionTableRow[] = [];
          while (1) {
            const equipmentCodeOptionData = await getEquipmentCodeOptions(
              supabaseClient,
              {
                index,
                limit: FETCH_OPTION_LIMIT,
              }
            );
            const equipmentOptions = equipmentCodeOptionData.map(
              (equipmentCode, index) => {
                return {
                  option_field_id:
                    form.form_section[4].section_field[0].field_id,
                  option_id: equipmentCode.equipment_description_id as string,
                  option_order: index,
                  option_value:
                    equipmentCode.equipment_description_property_number_with_prefix as string,
                };
              }
            );
            equipmentCodeOptionList.push(...equipmentOptions);

            if (equipmentCodeOptionData.length < FETCH_OPTION_LIMIT) break;
            index += FETCH_OPTION_LIMIT;
          }

          setEquipmentCodeOptions(equipmentCodeOptionList);

          // fetch unit options
          index = 0;
          const unitOptionList: OptionTableRow[] = [];
          while (1) {
            const unitOptionData = await getEquipmentUnitOptions(
              supabaseClient,
              {
                index,
                limit: FETCH_OPTION_LIMIT,
              }
            );
            const unitOptions = unitOptionData.map((equipmentCode, index) => {
              return {
                option_field_id: form.form_section[4].section_field[5].field_id,
                option_id: equipmentCode.equipment_unit_of_measurement_id,
                option_order: index,
                option_value: equipmentCode.equipment_unit_of_measurement,
              };
            });
            unitOptionList.push(...unitOptions);

            if (unitOptionData.length < FETCH_OPTION_LIMIT) break;
            index += FETCH_OPTION_LIMIT;
          }
          setEquipmentUnitOptions(unitOptionList);

          replaceSection([
            currentSection,
            {
              ...headerSection,
              // remove purpose onward field
              section_field: [...headerSection.section_field.slice(0, 4)],
            },
            // add equipment section
            {
              ...form.form_section[4],
              section_field: [
                {
                  // add equipment code options
                  ...form.form_section[4].section_field[0],
                  field_option: equipmentCodeOptionList,
                },
                ...form.form_section[4].section_field.slice(1, 5),
                {
                  // add equipment unit options
                  ...form.form_section[4].section_field[5],
                  field_option: unitOptionList,
                },
              ],
            },
          ]);
        } else if (value === "Person with Equipment") {
          // fetch position options
          let index = 0;
          const positionOptionList: OptionTableRow[] = [];
          while (1) {
            const positionOptionData = await getEmployeePositionOptions(
              supabaseClient,
              {
                index,
                limit: FETCH_OPTION_LIMIT,
              }
            );
            const positionOptions = positionOptionData.map(
              (position, index) => {
                return {
                  option_field_id:
                    form.form_section[6].section_field[0].field_id,
                  option_id: position.employee_job_title_id,
                  option_order: index,
                  option_value: position.employee_job_title_label,
                };
              }
            );
            positionOptionList.push(...positionOptions);

            if (positionOptionData.length < FETCH_OPTION_LIMIT) break;
            index += FETCH_OPTION_LIMIT;
          }

          // fetch equipment code options
          index = 0;
          const equipmentCodeOptionList: OptionTableRow[] = [];
          while (1) {
            const equipmentCodeOptionData = await getEquipmentCodeOptions(
              supabaseClient,
              {
                index,
                limit: FETCH_OPTION_LIMIT,
              }
            );
            const equipmentOptions = equipmentCodeOptionData.map(
              (equipmentCode, index) => {
                return {
                  option_field_id:
                    form.form_section[5].section_field[3].field_id,
                  option_id: equipmentCode.equipment_description_id as string,
                  option_order: index,
                  option_value:
                    equipmentCode.equipment_description_property_number_with_prefix as string,
                };
              }
            );
            equipmentCodeOptionList.push(...equipmentOptions);

            if (equipmentCodeOptionData.length < FETCH_OPTION_LIMIT) break;
            index += FETCH_OPTION_LIMIT;
          }
          setEquipmentCodeOptions(equipmentCodeOptionList);

          // fetch unit options
          index = 0;
          const unitOptionList: OptionTableRow[] = [];
          while (1) {
            const unitOptionData = await getEquipmentUnitOptions(
              supabaseClient,
              {
                index,
                limit: FETCH_OPTION_LIMIT,
              }
            );
            const unitOptions = unitOptionData.map((equipmentCode, index) => {
              return {
                option_field_id: form.form_section[5].section_field[8].field_id,
                option_id: equipmentCode.equipment_unit_of_measurement_id,
                option_order: index,
                option_value: equipmentCode.equipment_unit_of_measurement,
              };
            });
            unitOptionList.push(...unitOptions);

            if (unitOptionData.length < FETCH_OPTION_LIMIT) break;
            index += FETCH_OPTION_LIMIT;
          }
          setEquipmentUnitOptions(unitOptionList);

          replaceSection([
            currentSection,
            {
              ...headerSection,
              section_field: [
                ...headerSection.section_field.slice(0, 4),
                // add purpose onward field
                ...form.form_section[1].section_field.slice(4),
              ],
            },
            // add employee with equipment section
            {
              ...form.form_section[5],
              section_field: [
                ...form.form_section[5].section_field.slice(0, 3),
                {
                  ...form.form_section[5].section_field[3],
                  field_option: equipmentCodeOptionList,
                },
                ...form.form_section[5].section_field.slice(4, 8),
                {
                  ...form.form_section[5].section_field[8],
                  field_option: unitOptionList,
                },
              ],
            },
            // add content section
            {
              ...form.form_section[6],
              section_field: [
                {
                  ...form.form_section[6].section_field[0],
                  field_option: positionOptionList,
                },
                ...form.form_section[6].section_field.slice(1, 4),
                ...form.form_section[6].section_field.slice(5, 6),
              ],
            },
          ]);
        }
      } else {
        updateSection(1, {
          ...headerSection,
          section_field: [...headerSection.section_field.slice(0, 4)],
        });
      }
    } catch (e) {
      setValue(`sections.0.section_field.0.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleMannerOfTransferChange = async (
    value: string | null,
    prevValue: string | null
  ) => {
    const newSection = getValues(`sections.1`);
    setSignerFromList([]);
    setSignerToList([]);
    try {
      if (prevValue) {
        const splittedValue = prevValue.split(" to ");
        const newFields = [
          ...newSection.section_field.slice(0, 3),
          ...(["Department", "Central Office"].includes(splittedValue[1])
            ? [
                {
                  ...form.form_section[1].section_field[3],
                  field_option: projectDepartmentOptions,
                },
              ]
            : []),
          ...newSection.section_field.slice(3),
        ];
        updateSection(1, {
          ...newSection,
          section_field: newFields,
        });
      }

      if (value) {
        const newSection = getValues(`sections.1`);
        setLoadingFieldList([
          { sectionIndex: 1, fieldIndex: 1 },
          { sectionIndex: 1, fieldIndex: 2 },
        ]);
        const splittedValue = value.split(" to ");

        const fromOption =
          splittedValue[0] === "Project"
            ? projectOptions
            : splittedValue[0] === "Central Office" ||
              splittedValue[0] === "Department"
            ? departmentOptions
            : initialProjectOption;

        const toOptions =
          splittedValue[1] === "Project"
            ? projectOptions
            : splittedValue[1] === "Central Office" ||
              splittedValue[0] === "Department"
            ? departmentOptions
            : initialProjectOption;

        const newFields = [
          newSection.section_field[0],
          {
            ...newSection.section_field[1],
            field_option: fromOption,
            field_response: "",
          },
          {
            ...newSection.section_field[2],
            field_option: toOptions,
            field_response: "",
          },
          ...newSection.section_field.slice(
            ["Department", "Central Office"].includes(splittedValue[1]) ? 4 : 3
          ),
        ];

        updateSection(1, {
          ...newSection,
          section_field: newFields,
        });
      } else {
        const newFields = [
          newSection.section_field[0],
          {
            ...newSection.section_field[1],
            field_option: [],
          },
          {
            ...newSection.section_field[2],
            field_option: [],
          },
          ...newSection.section_field.slice(3),
        ];
        updateSection(1, {
          ...newSection,
          section_field: newFields,
        });
      }
    } catch (e) {
      setValue(`sections.1.section_field.0.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleFromChange = async (value: string | null) => {
    const mannerOfTransferValue = getValues(
      `sections.1.section_field.0.field_response`
    );
    const isDepartmentToDepartment =
      mannerOfTransferValue === "Department to Department";
    try {
      setIsFetchingSigner(true);
      if (value) {
        const projectId = initialProjectOption.find(
          (option) => option.option_value === value
        )?.option_id;
        if (projectId) {
          const data = await getProjectSignerWithTeamMember(supabaseClient, {
            projectId,
            formId,
            requesterTeamMemberId: `${teamMember?.team_member_id}`,
          });
          const signerData = data as unknown as FormType["form_signer"];
          if (data.length !== 0) {
            setSignerFromList(signerData);
            if (isDepartmentToDepartment) {
              setSignerToList(signerData);
            }
          }
        }
      } else {
        setSignerFromList([]);
        if (isDepartmentToDepartment) {
          setValue("sections.1.section_field.2.field_response", value);
          setSignerToList([]);
        }
      }
    } catch (e) {
      setSignerFromList([]);
      setValue(`sections.1.section_field.1.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
      setIsFetchingSigner(false);
    }
  };

  const handleToChange = async (value: string | null) => {
    try {
      setIsFetchingSigner(true);
      if (value) {
        const projectId = initialProjectOption.find(
          (option) => option.option_value === value
        )?.option_id;
        if (projectId) {
          const data = await getProjectSignerWithTeamMember(supabaseClient, {
            projectId,
            formId,
            requesterTeamMemberId: `${teamMember?.team_member_id}`,
          });
          const signerData = data as unknown as FormType["form_signer"];
          if (data.length !== 0) {
            setSignerToList(signerData);
          }
        }
      } else {
        setSignerToList([]);
      }
    } catch (e) {
      setSignerToList([]);
      setValue(`sections.1.section_field.2.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
      setIsFetchingSigner(false);
    }
  };

  const handlePurposeChange = async (
    value: string | null,
    prevValue: string | null
  ) => {
    const typeSection = getValues(`sections.0`);
    const headerSection = getValues(`sections.1`);
    const otherSections = getValues(`sections`).filter(
      (section, index) =>
        index > 1 && section.section_name !== "Replacement / Reliever"
    );

    try {
      if (value && !prevValue) {
        setLoadingFieldList([{ sectionIndex: 1, fieldIndex: 4 }]);

        if (["Replacement", "Reliever"].includes(value)) {
          replaceSection([
            typeSection,
            headerSection,
            // add replacement / reliever section
            form.form_section[2],
            ...otherSections,
          ]);
        }
      } else if (value && prevValue) {
        if (
          ["Replacement", "Reliever"].includes(prevValue) &&
          !["Replacement", "Reliever"].includes(value)
        ) {
          // remove replacement / reliever section
          replaceSection([typeSection, headerSection, ...otherSections]);
        } else if (
          !["Replacement", "Reliever"].includes(prevValue) &&
          ["Replacement", "Reliever"].includes(value)
        ) {
          replaceSection([
            typeSection,
            headerSection,
            // add replacement / reliever section
            form.form_section[2],
            ...otherSections,
          ]);
        }
      } else {
        // remove replacement / reliever section
        replaceSection([typeSection, headerSection, ...otherSections]);
      }
    } catch (e) {
      setValue(`sections.1.section_field.4.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleEquipmentCodeChange = async (
    value: string | null,
    index: number
  ) => {
    const typeOfTransfer = getValues(
      "sections.0.section_field.0.field_response"
    );
    let additionalIndex = 0;
    if (typeOfTransfer === "Person with Equipment") {
      additionalIndex = 3;
    }
    const newSection = getValues(`sections.${index}`);
    try {
      if (value) {
        setLoadingFieldList([
          { sectionIndex: index, fieldIndex: 1 + additionalIndex },
          { sectionIndex: index, fieldIndex: 2 + additionalIndex },
          { sectionIndex: index, fieldIndex: 3 + additionalIndex },
        ]);

        const equipmentDescription = await getEquipmentDescription(
          supabaseClient,
          { propertyNumber: value }
        );

        updateSection(index, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 1 + additionalIndex),
            {
              ...newSection.section_field[1 + additionalIndex],
              field_response:
                equipmentDescription.equipment_description_brand
                  .equipment_brand,
            },
            {
              ...newSection.section_field[2 + additionalIndex],
              field_response:
                equipmentDescription.equipment_description_model
                  .equipment_model,
            },
            {
              ...newSection.section_field[3 + additionalIndex],
              field_response:
                equipmentDescription.equipment_description_serial_number,
            },
            ...newSection.section_field.slice(4 + additionalIndex),
          ],
        });
      } else {
        updateSection(index, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 1 + additionalIndex),
            {
              ...newSection.section_field[1 + additionalIndex],
              field_response: "",
            },
            {
              ...newSection.section_field[2 + additionalIndex],
              field_response: "",
            },
            {
              ...newSection.section_field[3 + additionalIndex],
              field_response: "",
            },
            ...newSection.section_field.slice(4 + additionalIndex),
          ],
        });
      }
    } catch (e) {
      setValue(
        `sections.${index}.section_field.${additionalIndex}.field_response`,
        ""
      );
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleEmployeeNumberChange = async (
    value: string | null,
    index: number
  ) => {
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: index, fieldIndex: 1 }]);

        const employee = await getEmployeeName(supabaseClient, {
          employeeId: value,
        });

        if (employee) {
          setValue(
            `sections.${index}.section_field.1.field_response`,
            `${employee.scic_employee_first_name} ${
              employee.scic_employee_middle_name
            } ${employee.scic_employee_last_name} ${
              employee.scic_employee_suffix ?? ""
            }`
          );
        } else {
          setValue(`sections.${index}.section_field.0.field_response`, "");
          setValue(`sections.${index}.section_field.1.field_response`, "");
          notifications.show({
            message: `There's no employee with HRIS ${value}`,
            color: "orange",
          });
          return;
        }
      } else {
        setValue(`sections.${index}.section_field.0.field_response`, "");
        setValue(`sections.${index}.section_field.1.field_response`, "");
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.0.field_response`, "");
      setValue(`sections.${index}.section_field.1.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleITAssetBooleanChange = async (value: boolean, index: number) => {
    const allSections = getValues(`sections`);
    try {
      setLoadingFieldList([{ sectionIndex: index, fieldIndex: 2 }]);
      if (value) {
        insertSection(index + 1, form.form_section[7], { shouldFocus: false });
        setTimeout(
          () =>
            setFocus(`sections.${index + 1}.section_field.0.field_response`),
          0
        );
      } else {
        replaceSection(
          allSections.filter(
            (section) => section.section_name !== "Asset Information"
          )
        );
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.0.field_response`, "");
      setValue(`sections.${index}.section_field.1.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleEmployeeStatusChange = async (
    value: string | null,
    prevValue: string | null,
    index: number
  ) => {
    const currentSection = getValues(`sections.${index}`);
    try {
      setLoadingFieldList([{ sectionIndex: index, fieldIndex: 3 }]);

      if (value === "Contractual") {
        removeSection(index);
        insertSection(
          index,
          {
            ...currentSection,
            section_field: [
              ...currentSection.section_field.slice(0, 4),
              form.form_section[6].section_field[4],
              ...currentSection.section_field.slice(4),
            ],
          },
          { shouldFocus: false }
        );
      } else if (prevValue === "Contractual") {
        removeSection(index);
        insertSection(
          index,
          {
            ...currentSection,
            section_field: [
              ...currentSection.section_field.slice(0, 4),
              ...currentSection.section_field.slice(5),
            ],
          },
          { shouldFocus: false }
        );
      }
    } catch (e) {
      setValue(`sections.${index}.section_field.3.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handlePhaseOfWorkChange = async (
    value: string | null,
    sectionIndex: number,
    fieldIndex: number
  ) => {
    const currentSection = getValues(`sections.${sectionIndex}`);
    try {
      setLoadingFieldList([{ sectionIndex, fieldIndex }]);

      const newSectionField = currentSection.section_field.filter(
        (field) =>
          !["Area of Assignment", "Specific Work Assignment"].includes(
            field.field_name
          )
      );

      removeSection(sectionIndex);
      if (value === "Area of Assignment") {
        insertSection(
          sectionIndex,
          {
            ...currentSection,
            section_field: [
              ...newSectionField,
              form.form_section[6].section_field[6],
            ],
          },
          { shouldFocus: false }
        );
      } else if (value === "Specific Work Assignment") {
        insertSection(
          sectionIndex,
          {
            ...currentSection,
            section_field: [
              ...newSectionField,
              form.form_section[6].section_field[7],
            ],
          },
          { shouldFocus: false }
        );
      } else {
        insertSection(
          sectionIndex,
          {
            ...currentSection,
            section_field: newSectionField,
          },
          { shouldFocus: false }
        );
      }
    } catch (e) {
      setValue(
        `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`,
        ""
      );
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
                    personnelTransferRequisitionMethods={{
                      onMannerOfTransferChange: handleMannerOfTransferChange,
                      onFromChange: handleFromChange,
                      onToChange: handleToChange,
                      onTypeOfTransferChange: handleTypeOfTransferChange,
                      onPurposeChange: handlePurposeChange,
                      onEquipmentCodeChange: handleEquipmentCodeChange,
                      onEmployeeNumberChange: handleEmployeeNumberChange,
                      onITAssetBooleanChange: handleITAssetBooleanChange,
                      onEmployeeStatusChange: handleEmployeeStatusChange,
                      onPhaseOfWorkChange: handlePhaseOfWorkChange,
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

export default CreatePersonnelTransferRequisition;
