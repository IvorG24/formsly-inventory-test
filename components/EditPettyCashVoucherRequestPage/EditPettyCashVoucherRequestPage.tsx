import {
  getEmployeeName,
  getNonDuplictableSectionResponse,
  getProjectSignerWithTeamMember,
  getSectionInRequestPage,
} from "@/backend/api/get";
import { createRequest, editRequest, insertError } from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import RequestFormSigner from "@/components/CreateRequestPage/RequestFormSigner";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import { CSI_HIDDEN_FIELDS } from "@/utils/constant";
import { Database } from "@/utils/database";
import { isError, safeParse } from "@/utils/functions";
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
  departmentOptions: OptionTableRow[];
  bankListOptions: OptionTableRow[];
  uomOptions: OptionTableRow[];
  equipmentCodeOptions: OptionTableRow[];
};

const EditPettyCashVoucherRequestPage = ({
  form,
  projectOptions,
  requestId,
  departmentOptions,
  bankListOptions,
  uomOptions,
  equipmentCodeOptions,
  duplicatableSectionIdList,
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
  const { handleSubmit, control, setValue, unregister, getValues, setFocus } =
    requestFormMethods;
  const {
    fields: formSections,
    replace: replaceSection,
    update: updateSection,
    insert: insertSection,
    remove: removeSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  const onSubmit = async (data: RequestFormValues) => {
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

      const response = data.sections[1].section_field[0]
        .field_response as string;

      const projectId = data.sections[1].section_field[0].field_option.find(
        (option) => option.option_value === response
      )?.option_id as string;

      const additionalSignerList: FormType["form_signer"] = [];

      if (![...signerList, ...additionalSignerList].length) {
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
          signers: [...signerList, ...additionalSignerList],
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
          signers: [...signerList, ...additionalSignerList],
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
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "onSubmit",
          },
        });
      }
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

  const handleProjectOrDepartmentNameChange = async () => {
    try {
      setIsFetchingSigner(true);
      const selectedProject = getValues(
        `sections.1.section_field.0.field_response`
      );
      const selectedDepartment = getValues(
        `sections.1.section_field.2.field_response`
      );

      const projectId = projectOptions.find(
        (option) => option.option_value === selectedProject
      )?.option_id;
      const departmentId = departmentOptions.find(
        (option) => option.option_value === selectedDepartment
      )?.option_id;

      if (projectId) {
        const data = await getProjectSignerWithTeamMember(supabaseClient, {
          projectId,
          formId: form.form_id,
          departmentId: departmentId ?? undefined,
        });
        if (data.length !== 0) {
          setSignerList(data as unknown as FormType["form_signer"]);
        } else {
          resetSigner();
        }
      }

      const isPed = selectedDepartment === "Plants and Equipment";
      const requestDetailsSection = getValues(`sections.1`);
      const pedConditionalField = form.form_section[1].section_field[10];
      const pedConditionalFieldExists =
        requestDetailsSection.section_field.findIndex(
          (field) =>
            field.field_name === "Is this request charged to the project?"
        );
      const chargeToProjectSectionIndex = getValues(`sections`).findIndex(
        (section) => section.section_name === "Charge to Project Details"
      );

      if (isPed && !pedConditionalFieldExists) {
        updateSection(1, {
          ...requestDetailsSection,
          section_field: [
            ...requestDetailsSection.section_field,
            pedConditionalField,
          ],
        });
      } else if (!isPed && pedConditionalFieldExists) {
        updateSection(1, {
          ...requestDetailsSection,
          section_field: requestDetailsSection.section_field.filter(
            (field) => field.field_order !== 11
          ),
        });
        if (chargeToProjectSectionIndex > 0) {
          removeSection(chargeToProjectSectionIndex);
        }
      }
    } catch (e) {
      setValue(`sections.1.section_field.0.field_response`, "");
      setValue(`sections.1.section_field.2.field_response`, "");
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
    if (initialRequestDetails) {
      handleUpdateConditionalSectionAndField(initialRequestDetails.sections);
    }
  };

  const handlePettyCashVoucherBooleanChange = (
    value: boolean,
    sectionIndex: number
  ) => {
    try {
      const selectedSection = getValues(`sections.${sectionIndex}`);
      const pedConditionalFieldExists = selectedSection.section_field.find(
        (field) =>
          field.field_name === "Is this request charged to the project?"
      );

      if (value) {
        let selectedSectionFieldList = [
          ...selectedSection.section_field.slice(0, 9),
          form.form_section[sectionIndex].section_field[9],
        ];

        if (pedConditionalFieldExists) {
          selectedSectionFieldList = [
            ...selectedSectionFieldList,
            pedConditionalFieldExists,
          ];
        }
        updateSection(sectionIndex, {
          ...selectedSection,
          section_field: selectedSectionFieldList,
        });
        setTimeout(
          () =>
            setFocus(`sections.${sectionIndex}.section_field.9.field_response`),
          0
        );
      } else {
        updateSection(sectionIndex, {
          ...selectedSection,
          section_field: selectedSection.section_field.filter(
            (field) => field.field_name !== "Approved Official Business"
          ),
        });
      }
    } catch (e) {
      setValue(
        `sections.${sectionIndex}.section_field.8.field_response`,
        false
      );

      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleEmployeeNumberChange = async (
    value: string | null,
    sectionIndex: number
  ) => {
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex, fieldIndex: 1 }]);

        const employee = await getEmployeeName(supabaseClient, {
          employeeId: value,
        });

        if (employee) {
          setValue(
            `sections.${sectionIndex}.section_field.4.field_response`,
            `${employee.scic_employee_first_name} ${
              employee.scic_employee_middle_name
            } ${employee.scic_employee_last_name} ${
              employee.scic_employee_suffix ?? ""
            }`
          );
        } else {
          setValue(
            `sections.${sectionIndex}.section_field.3.field_response`,
            ""
          );
          setValue(
            `sections.${sectionIndex}.section_field.4.field_response`,
            ""
          );
          notifications.show({
            message: `There's no employee with HRIS ${value}`,
            color: "orange",
          });
          return;
        }
      } else {
        setValue(`sections.${sectionIndex}.section_field.3.field_response`, "");
        setValue(`sections.${sectionIndex}.section_field.4.field_response`, "");
      }
    } catch (e) {
      setValue(`sections.${sectionIndex}.section_field.3.field_response`, "");
      setValue(`sections.${sectionIndex}.section_field.4.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleAccountingAuthorizationBooleanChange = (value: boolean) => {
    try {
      if (value) {
        const requestDetailsSection = form.form_section[1];
        const sectionWithProjectOptions = {
          ...requestDetailsSection,
          section_field: [
            {
              ...requestDetailsSection.section_field[0],
              field_option: projectOptions,
            },
            requestDetailsSection.section_field[1],
            {
              ...requestDetailsSection.section_field[2],
              field_option: departmentOptions,
            },
            ...requestDetailsSection.section_field.slice(3, 9),
          ],
        };

        insertSection(1, sectionWithProjectOptions, { focusIndex: 0 });
      } else if (!value) {
        const requestDetailsSectionExists = getValues(`sections.1`);
        if (requestDetailsSectionExists) {
          removeSection(1);
        }
      }
    } catch (e) {
      setValue(`sections.0.section_field.0.field_response`, false);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleChargeToProjectBooleanChange = (value: boolean) => {
    try {
      const chargeToProjectSectionExists = getValues(`sections`).findIndex(
        (section) => section.section_name === "Charge to Project Details"
      );

      if (Boolean(value) && chargeToProjectSectionExists < 0) {
        const chargeToProjectSection = form.form_section[2];
        const sectionWithProjectOptions = {
          ...chargeToProjectSection,
          section_field: [
            {
              ...chargeToProjectSection.section_field[0],
              field_option: projectOptions,
            },
            ...chargeToProjectSection.section_field.slice(1, 3),
          ],
        };

        insertSection(2, sectionWithProjectOptions, { focusIndex: 0 });
      } else if (!value && chargeToProjectSectionExists > 0) {
        const requestDetailsSectionExists = getValues(`sections.1`);
        if (requestDetailsSectionExists) {
          removeSection(chargeToProjectSectionExists);
        }
      }
    } catch (e) {
      const requestDetailsSection = getValues(`sections.1`);
      const pedConditionalFieldIndex =
        requestDetailsSection.section_field.findIndex(
          (field) =>
            field.field_name === "Is this request charged to the project?"
        );
      setValue(
        `sections.1.section_field.${pedConditionalFieldIndex}.field_response`,
        false
      );
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleModeOfPaymentChange = (
    value: string | null,
    sectionIndex: number
  ) => {
    try {
      if (!value) return;

      const selectedSection = getValues(`sections.${sectionIndex}`);
      let currentSectionField = selectedSection.section_field;

      const isBankTransfer = value === "Bank Transfer";
      const paymentOptionField = {
        ...form.form_section[3].section_field[1],
        field_option: bankListOptions,
      };
      const paymentOptionFieldExists = currentSectionField.some(
        (field) => field.field_id === paymentOptionField.field_id
      );

      const conditionalFields = form.form_section[3].section_field.filter(
        (field) => ["Account Name", "Account Number"].includes(field.field_name)
      );

      const fieldExists = (fieldName: string) =>
        currentSectionField.some((field) => field.field_name === fieldName);

      const addFields = (fields: Field[]) =>
        (currentSectionField = [...currentSectionField, ...fields]);

      const removeField = (fieldName: string) =>
        (currentSectionField = currentSectionField.filter(
          (field) => field.field_name !== fieldName
        ));

      if (isBankTransfer) {
        if (paymentOptionFieldExists) return;
        if (fieldExists("Account Name")) {
          addFields([paymentOptionField]);
        } else {
          addFields([paymentOptionField, ...conditionalFields]);
        }
      } else {
        if (!fieldExists("Account Name")) {
          addFields(conditionalFields);
        } else if (fieldExists("Payment Option")) {
          removeField("Payment Option");
        }
      }

      currentSectionField.sort((a, b) => a.field_order - b.field_order);
      removeSection(sectionIndex);
      insertSection(
        sectionIndex,
        { ...selectedSection, section_field: currentSectionField },
        { shouldFocus: false }
      );
    } catch (e) {
      setValue(`sections.3.section_field.0.field_response`, false);

      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleSCICAuthorizationBooleanChange = (value: boolean) => {
    try {
      const currentRequestSectionList = getValues(`sections`);
      const particularSectionExists = currentRequestSectionList.some(
        (section) => section.section_name === "Particular Details"
      );

      if (value && !particularSectionExists) {
        const particularSection = form.form_section[5];
        const sectionFieldWithOptions = particularSection.section_field.map(
          (field) =>
            field.field_name === "Unit of Measure"
              ? { ...field, field_option: uomOptions }
              : field
        );
        const sectionWithProjectOptions = {
          ...particularSection,
          section_field: sectionFieldWithOptions,
        };

        insertSection(
          currentRequestSectionList.length,
          sectionWithProjectOptions,
          { focusIndex: 0 }
        );
      } else if (!value) {
        if (particularSectionExists) {
          removeSection(currentRequestSectionList.length - 1);
        }
      }
    } catch (e) {
      const requestDetailsSection = getValues(`sections.1`);
      const pedConditionalFieldIndex =
        requestDetailsSection.section_field.findIndex(
          (field) =>
            field.field_name === "Is this request charged to the project?"
        );
      setValue(
        `sections.1.section_field.${pedConditionalFieldIndex}.field_response`,
        false
      );
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleUpdateConditionalSectionAndField = (sections: Section[]) => {
    handleProjectOrDepartmentNameChange();

    const isChargedToProject = sections[1].section_field.find(
      (field) => field.field_name === "Is this request charged to the project?"
    )?.field_response;

    handleChargeToProjectBooleanChange(isChargedToProject as boolean);

    if (Boolean(isChargedToProject)) {
      const typeOfRequestValue = safeParse(
        `${sections[2].section_field[1].field_response}`
      );

      handleTypeOfRequestChange(typeOfRequestValue);
    }

    const paymentDetailsSectionIndex = sections.findIndex(
      (section) => section.section_name === "Payment Details"
    );
    const modeOfPayment =
      sections[paymentDetailsSectionIndex].section_field[0].field_response;

    handleModeOfPaymentChange(
      safeParse(`${modeOfPayment}`),
      paymentDetailsSectionIndex
    );

    const scicAuthorizationSectionIndex = sections.findIndex(
      (section) =>
        section.section_name === "SCIC Salary Deduction Authorization"
    );
    const scicAuthorization =
      sections[scicAuthorizationSectionIndex].section_field[0].field_response;

    handleSCICAuthorizationBooleanChange(scicAuthorization as boolean);
  };

  const handleTypeOfRequestChange = (value: string | null) => {
    try {
      const chargeToProjectSection = getValues(`sections.2`);
      let chargeToProjectSectionFieldList =
        chargeToProjectSection.section_field;

      const addField = (fieldIndex: number) => {
        const selectedField = form.form_section[2].section_field[fieldIndex];
        if (selectedField.field_name === "Equipment Code") {
          selectedField.field_option = equipmentCodeOptions;
        }
        chargeToProjectSectionFieldList = [
          ...chargeToProjectSectionFieldList,
          selectedField,
        ];
      };

      const removeFieldById = (fieldId: string) => {
        chargeToProjectSectionFieldList =
          chargeToProjectSectionFieldList.filter(
            (field) => field.field_id !== fieldId
          );
      };

      if (value) {
        const specifyOtherTypeOfRequestField =
          chargeToProjectSectionFieldList.find(
            (field) => field.field_name === "Specify Other Type of Request"
          );
        const equipmentCodeField = chargeToProjectSectionFieldList.find(
          (field) => field.field_name === "Equipment Code"
        );

        switch (value) {
          case "Other":
            addField(3);
            if (equipmentCodeField)
              removeFieldById(equipmentCodeField.field_id);
            break;
          case "Spare Part":
            addField(4);
            if (specifyOtherTypeOfRequestField)
              removeFieldById(specifyOtherTypeOfRequestField.field_id);
            break;

          default:
            chargeToProjectSectionFieldList =
              chargeToProjectSection.section_field.slice(0, 3);
            break;
        }
      } else {
        chargeToProjectSectionFieldList =
          chargeToProjectSection.section_field.slice(0, 3);
      }
      removeSection(2);
      insertSection(2, {
        ...chargeToProjectSection,
        section_field: chargeToProjectSectionFieldList.sort(
          (a, b) => a.field_order - b.field_order
        ),
      });
    } catch (e) {
      setValue(`sections.2.section_field.1.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleQuantityOrUnitCostChange = (sectionIndex: number) => {
    try {
      const currentSectionFieldList = getValues(
        `sections.${sectionIndex}`
      ).section_field;

      const quantityField = currentSectionFieldList.find(
        (field) => field.field_name === "Quantity"
      );
      const quantityFieldResponse = Number(quantityField?.field_response) || 0;

      const unitCostFieldResponse =
        Number(
          currentSectionFieldList.find(
            (field) => field.field_name === "Unit Cost"
          )?.field_response
        ) || 0;

      const amountFieldIndex = currentSectionFieldList.findIndex(
        (field) => field.field_name === "Amount"
      );

      const amount = quantityField
        ? quantityFieldResponse * unitCostFieldResponse
        : unitCostFieldResponse;

      setValue(
        `sections.${sectionIndex}.section_field.${amountFieldIndex}.field_response`,
        amount
      );
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleParticularTypeChange = (
    value: string | null,
    sectionIndex: number
  ) => {
    try {
      if (!value) return;

      const currentSection = getValues(`sections.${sectionIndex}`);
      const currentSectionFieldList = currentSection.section_field;
      const conditionalFieldsNameList = [
        "Unit of Measure",
        "Quantity",
        "Particular Request ID",
      ];
      const conditionalFieldsExists = currentSectionFieldList.some((field) =>
        conditionalFieldsNameList.includes(field.field_name)
      );

      if (value === "Item") {
        if (conditionalFieldsExists) return;

        const conditionalFieldList = form.form_section[5].section_field
          .filter((field) =>
            conditionalFieldsNameList.includes(field.field_name)
          )
          .map((field) =>
            field.field_name === "Unit of Measure"
              ? { ...field, field_option: uomOptions }
              : field
          );

        const updatedSectionFieldList = [
          ...currentSectionFieldList,
          ...conditionalFieldList,
        ].sort((a, b) => a.field_order - b.field_order);

        removeSection(sectionIndex);
        insertSection(sectionIndex, {
          ...currentSection,
          section_field: updatedSectionFieldList,
        });
      } else if (value === "Non Item") {
        if (!conditionalFieldsExists) return;
        removeSection(sectionIndex);
        insertSection(sectionIndex, {
          ...currentSection,
          section_field: currentSectionFieldList.filter(
            (field) => !conditionalFieldsNameList.includes(field.field_name)
          ),
        });
      }
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
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
          if (field.field_name === "Unit of Measure") {
            return {
              ...field,
              field_section_duplicatable_id: sectionDuplicatableId,
              field_option: uomOptions,
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

  useEffect(() => {
    setIsLoading(true);
    if (!team.team_id) return;
    try {
      const duplicatableSection = form.form_section[5];
      const fetchRequestDetails = async () => {
        const newFields: RequestWithResponseType["request_form"]["form_section"][0]["section_field"] =
          [];
        let index = 0;
        while (1) {
          setIsLoading(true);
          const duplicatableSectionIdCondition = duplicatableSectionIdList
            .slice(index, index + 5)
            .map((dupId) => `'${dupId}'`)
            .join(",");

          const data = await getSectionInRequestPage(supabaseClient, {
            index,
            requestId: requestId,
            sectionId: duplicatableSection.section_id,
            duplicatableSectionIdCondition:
              duplicatableSectionIdCondition.length !== 0
                ? duplicatableSectionIdCondition
                : `'${uuidv4()}'`,
          });
          newFields.push(...data);
          index += 5;

          if (index > duplicatableSectionIdList.length) break;
        }

        const newFieldsWithOptions = newFields.map((field) => {
          const fieldOption = duplicatableSection.section_field.find(
            (formField) => formField.field_id === field.field_id
          )?.field_option;
          if (field.field_name === "Particular Type") {
            field.field_option = fieldOption || [];
          }

          return field;
        });

        const uniqueFieldIdList: string[] = [];
        const combinedFieldList: RequestWithResponseType["request_form"]["form_section"][0]["section_field"] =
          [];
        newFieldsWithOptions.forEach((field) => {
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

        const newSection = generateSectionWithDuplicateList([
          {
            ...form.form_section[5],
            section_field: combinedFieldList,
          },
        ]).map((section) => {
          return {
            ...section,
            section_field: section.section_field.filter(
              (field) => !CSI_HIDDEN_FIELDS.includes(field.field_name)
            ),
          };
        });

        const formattedSection = newSection.map((section) => {
          const fieldList: Section["section_field"] = [];
          section.section_field.forEach((field) => {
            const response = field.field_response?.request_response
              ? safeParse(field.field_response?.request_response)
              : "";
            let option: OptionTableRow[] = field.field_option ?? [];

            switch (field.field_name) {
              case "Unit of Measure":
                option = uomOptions;
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

        const nonDuplicatableSectionList = form.form_section.slice(0, 5);

        const formSectionResponseList = await getNonDuplictableSectionResponse(
          supabaseClient,
          {
            requestId,
            fieldIdList: nonDuplicatableSectionList.flatMap((section) =>
              section.section_field.map((field) => field.field_id)
            ),
          }
        );

        let formSectionWithResponse = nonDuplicatableSectionList.map(
          (section) => {
            let fieldWithResponseList = section.section_field.map((field) => {
              const response = formSectionResponseList.find(
                (response) =>
                  response.request_response_field_id === field.field_id
              );
              let field_option = field.field_option ?? [];

              switch (field.field_id) {
                case "a1fdfcbb-5a2f-4b9d-8c6a-8c45e64e1d3b":
                case "2bac0084-53f4-419f-aba7-fb1f77403e00":
                  field_option = projectOptions;
                  break;
                case "694465de-8aa9-4361-be52-f8c091c13fde":
                  field_option = departmentOptions;
                  break;
                case "25420062-032b-4f87-a691-b49df749b3f1":
                  field_option = bankListOptions;
                  break;
                case "583bbdfa-cd76-44f5-a44f-8a4e8f232482":
                  field_option = uomOptions;
                  break;
                case "51404d52-6751-427e-9713-7c96a066472c":
                  field_option = equipmentCodeOptions;
                  break;
                default:
                  break;
              }

              return {
                ...field,
                field_response: response
                  ? safeParse(response.request_response)
                  : "",
                field_option,
              };
            });

            if (section.section_name === "Request Details") {
              const isForOfficialBusiness = fieldWithResponseList.find(
                (field) => field.field_name === "Is this for Official Business?"
              )?.field_response;

              if (!Boolean(isForOfficialBusiness)) {
                fieldWithResponseList = fieldWithResponseList.filter(
                  (field) => field.field_name !== "Approved Official Business"
                );
              }
            }

            return {
              ...section,
              section_field: fieldWithResponseList,
            };
          }
        );

        const isChargedToProject =
          formSectionWithResponse[1].section_field.find(
            (field) =>
              field.field_name === "Is this request charged to the project?"
          )?.field_response;

        if (!Boolean(isChargedToProject)) {
          formSectionWithResponse = formSectionWithResponse.filter(
            (section) => section.section_name !== "Charge to Project Details"
          );
        }

        const formSection = [
          ...formSectionWithResponse,
          ...sectionWithDuplicatableId,
        ];
        replaceSection(formSection);
        setInitialRequestDetails({ sections: formSection });
        handleUpdateConditionalSectionAndField(formSection);
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
                    pettyCashVoucherFormMethods={{
                      onProjectOrDepartmentNameChange:
                        handleProjectOrDepartmentNameChange,
                      onPettyCashVoucherBooleanChange:
                        handlePettyCashVoucherBooleanChange,
                      onEmployeeNumberChange: handleEmployeeNumberChange,
                      onAccountingAuthorizationBooleanChange:
                        handleAccountingAuthorizationBooleanChange,
                      onChargeToProjectBooleanChange:
                        handleChargeToProjectBooleanChange,
                      onModeOfPaymentChange: handleModeOfPaymentChange,
                      onSCICAuthorizationChange:
                        handleSCICAuthorizationBooleanChange,
                      onTypeOfRequestChange: handleTypeOfRequestChange,
                      onQuantityOrUnitCostChange:
                        handleQuantityOrUnitCostChange,
                      onParticularTypeChange: handleParticularTypeChange,
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

export default EditPettyCashVoucherRequestPage;
