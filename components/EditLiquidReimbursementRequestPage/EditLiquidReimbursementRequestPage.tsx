import {
  getNonDuplictableSectionResponse,
  getProjectSignerWithTeamMember,
  getPropertyNumberOptions,
  getSectionInRequestPage,
} from "@/backend/api/get";
import {
  createComment,
  createRequest,
  editRequest,
  insertError,
} from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import RequestFormSigner from "@/components/CreateRequestPage/RequestFormSigner";
import useEquipmentCodeOptionListStore from "@/stores/useEquipmentCodeOptionListStore";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import { ALLOWED_USER_TO_EDIT_LRF_REQUESTS } from "@/utils/constant";
import { Database } from "@/utils/database";
import {
  calculateInvoiceAmountWithVAT,
  isError,
  safeParse,
} from "@/utils/functions";
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
import { useUser } from "@supabase/auth-helpers-react";
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
  bankListOptions: OptionTableRow[];
  duplicatableSectionIdList: string[];
  requestId: string;
};

const EditLiquidReimbursementRequestPage = ({
  form,
  projectOptions,
  duplicatableSectionIdList,
  requestId,
  bankListOptions,
}: Props) => {
  const router = useRouter();
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const team = useActiveTeam();
  const user = useUser();
  const canEditVatField = user?.email === ALLOWED_USER_TO_EDIT_LRF_REQUESTS;

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
  const [isUpdatedByAccountant, setIsUpdatedByAccountant] = useState(false);
  const requestorProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();
  const { equipmentCodeOptionList, setEquipmentCodeOptionList } =
    useEquipmentCodeOptionListStore();

  const initialFormSectionList = [
    {
      ...form.form_section[0],
    },
    ...form.form_section.slice(1),
  ];

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
    insert: insertSection,
    remove: removeSection,
    replace: replaceSection,
    update: updateSection,
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

      const response = data.sections[0].section_field[0]
        .field_response as string;

      const projectId = data.sections[0].section_field[0].field_option.find(
        (option) => option.option_value === response
      )?.option_id as string;

      const additionalSignerList: FormType["form_signer"] = [];
      let request: RequestTableRow;

      if (![...signerList, ...additionalSignerList].length) {
        notifications.show({
          title: "There's no assigned signer.",
          message: <InvalidSignerNotification />,
          color: "orange",
          autoClose: false,
        });
        return;
      }

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

        if (isUpdatedByAccountant) {
          await createComment(supabaseClient, {
            comment_request_id: requestId,
            comment_team_member_id: teamMember.team_member_id,
            comment_type: "REQUEST_COMMENT",
            comment_content: `${requestorProfile?.user_first_name} ${requestorProfile?.user_last_name} updated the VAT value of Payee sections.`,
            comment_id: uuidv4(),
          });
        }
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

  const handleDuplicateSection = (sectionId: string) => {
    const sectionLastIndex = formSections
      .map((sectionItem) => sectionItem.section_id)
      .lastIndexOf(sectionId);
    const sectionMatch = initialFormSectionList.find(
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
      duplicatedFieldsWithDuplicatableId.splice(9, 1);
      const newSection = {
        ...sectionMatch,
        section_order: sectionLastIndex + 1,
        section_field: duplicatedFieldsWithDuplicatableId.filter(
          (field) =>
            ![
              "VAT",
              "Account Name",
              "Payment Option",
              "Account Number",
              "Specify Other Type of Request",
            ].includes(field.field_name)
        ),
      };

      insertSection(sectionLastIndex + 1, newSection, {
        focusIndex: sectionLastIndex + 1,
      });
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
      if (
        formSections.filter((section) => section.section_name === "Payee")
          .length === 1
      ) {
        const payeeMatchIndex = formSections.findIndex(
          (section) => section.section_name === "Payee"
        );
        const updatedSectionFieldList = formSections[
          payeeMatchIndex
        ].section_field.map((field) => ({
          ...field,
          field_section_duplicatable_id: undefined,
        }));
        updateSection(payeeMatchIndex, {
          ...formSections[payeeMatchIndex],
          section_field: updatedSectionFieldList,
        });
      }
    }
  };

  const handleAddOrRemoveRIRField = (value: string | null) => {
    // remove RIR field in Payee sections if value is not liquidation
    let currentSectionList = getValues(`sections`);
    const paymentSection = currentSectionList.find(
      (section) => section.section_name === "Payment"
    );
    const payeeSections = currentSectionList.filter(
      (section) => section.section_name === "Payee"
    );
    const combinedPayeeSectionFields = payeeSections.flatMap(
      (section) => section.section_field
    );
    const rirFieldExists = combinedPayeeSectionFields.some(
      (field) => field.field_name === "RIR Number"
    );
    if (!value?.toLowerCase().includes("liquidation") && rirFieldExists) {
      const payeeSectionWithoutRIRField = payeeSections.map((section) => ({
        ...section,
        section_field: section.section_field.filter(
          (field) => field.field_name !== "RIR Number"
        ),
      }));

      currentSectionList = [
        currentSectionList[0],
        ...payeeSectionWithoutRIRField,
      ];
    } else if (
      value?.toLowerCase().includes("liquidation") &&
      !rirFieldExists
    ) {
      // add RIR field in Payee sections if value is liquidation
      const rirField = initialFormSectionList[1].section_field[8];
      const payeeSectionWithRIRField = payeeSections.map((section) => ({
        ...section,
        section_field:
          section.section_field[2].field_response === "Materials"
            ? [...section.section_field, rirField]
            : section.section_field,
      }));
      currentSectionList = [currentSectionList[0], ...payeeSectionWithRIRField];
      replaceSection([formSections[0], ...payeeSectionWithRIRField]);
    }

    if (paymentSection) {
      currentSectionList = [...currentSectionList, paymentSection];
    }

    replaceSection(currentSectionList);
  };

  const handleAddOrRemovePaymentSection = (value: string | null) => {
    // remove payment if pure liquidation type
    const valueIsPureLiquidation = value?.toLowerCase() === "liquidation";
    const liquidationWithPR =
      value?.toLowerCase() === "liquidation with provisional receipt";
    const paymentSectionIndex = getValues(`sections`).findIndex(
      (section) => section.section_name === "Payment"
    );
    const paymentSectionIsRemoved = paymentSectionIndex < 0;

    if (
      (valueIsPureLiquidation || liquidationWithPR) &&
      !paymentSectionIsRemoved
    ) {
      removeSection(paymentSectionIndex);
    } else if (
      !(valueIsPureLiquidation || liquidationWithPR) &&
      paymentSectionIsRemoved
    ) {
      insertSection(formSections.length, form.form_section[2], {
        shouldFocus: false,
      });
    }
  };

  const handleAddOrRemoveRequestDetailsConditionalField = (
    value: string | null
  ) => {
    const currentRequestDetails = getValues(`sections.${0}`);
    const sectionFields = currentRequestDetails.section_field;
    const conditionalFieldExists = sectionFields.some(
      (field) => field.field_name === "Working Advances"
    );
    const isPettyCashFund = value === "Petty Cash Fund";
    const valueIsLiquidationTypeOrPCF =
      value?.toLowerCase().includes("liquidation") || isPettyCashFund;

    const addConditionalFields =
      valueIsLiquidationTypeOrPCF && !conditionalFieldExists;
    const removeConditionalFields =
      !valueIsLiquidationTypeOrPCF && conditionalFieldExists;

    if (addConditionalFields) {
      const liquidationAdditionalFields =
        initialFormSectionList[0].section_field.slice(5, 7);
      updateSection(0, {
        ...currentRequestDetails,
        section_field: [...sectionFields, ...liquidationAdditionalFields].sort(
          (a, b) => a.field_order - b.field_order
        ),
      });
    } else if (removeConditionalFields) {
      updateSection(0, {
        ...currentRequestDetails,
        section_field: sectionFields.filter(
          (field) =>
            !["Working Advances", "Ticket ID"].includes(field.field_name)
        ),
      });
    }

    handleAddOrRemoveConditionalWAVOption(
      valueIsLiquidationTypeOrPCF,
      isPettyCashFund
    );
  };

  const handleAddOrRemoveConditionalWAVOption = (
    valueIsLiquidationTypeOrPCF: boolean,
    isPettyCashFund: boolean
  ) => {
    if (!valueIsLiquidationTypeOrPCF) return;

    const wavFieldId = "b949fe36-d43f-497c-b821-bca21336474a";
    let wavField = initialFormSectionList[0].section_field.find(
      (field) => field.field_id === wavFieldId
    );
    if (!wavField) return;

    const pettyCashOptionValue = "Petty Cash Fund Reimbursement";
    const hasPettyCashOption = wavField.field_option.some(
      (option) => option.option_value === pettyCashOptionValue
    );
    if (isPettyCashFund && !hasPettyCashOption) {
      const pettyCashOption = wavField.field_option.find(
        (option) => option.option_value === pettyCashOptionValue
      );

      if (!pettyCashOption) return;
      wavField = {
        ...wavField,
        field_option: [...wavField.field_option, pettyCashOption],
      };
    } else if (!isPettyCashFund && hasPettyCashOption) {
      wavField = {
        ...wavField,
        field_option: wavField.field_option.filter(
          (option) => option.option_value !== pettyCashOptionValue
        ),
      };
    }

    const updatedRequestDetails = getValues(`sections.${0}`);
    updateSection(0, {
      ...updatedRequestDetails,
      section_field: updatedRequestDetails.section_field.map((field) =>
        field.field_id === wavFieldId ? (wavField as Field) : field
      ),
    });
  };

  const handleRequestTypeChange = async (value: string | null) => {
    try {
      handleAddOrRemoveRIRField(value);
      handleAddOrRemoveRequestDetailsConditionalField(value);
      handleAddOrRemovePaymentSection(value);
    } catch (e) {
      setValue(`sections.0.section_field.4.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleInvoiceAmountChange = (value: number, sectionIndex: number) => {
    try {
      const currentPayeeSection = getValues(`sections.${sectionIndex}`);
      const isWithVAT = Boolean(
        currentPayeeSection.section_field.find(
          (field) => field.field_name === "This payee have VAT?"
        )?.field_response
      );
      const conditionalVatFieldIndex =
        currentPayeeSection.section_field.findIndex(
          (field) => field.field_name === "VAT"
        );

      const vatFieldIndex = currentPayeeSection.section_field.findIndex(
        (field) => field.field_name === "VAT"
      );
      const costFieldIndex = currentPayeeSection.section_field.findIndex(
        (field) => field.field_name === "Cost"
      );

      if (isWithVAT) {
        const vatValue = calculateInvoiceAmountWithVAT(value);
        if (conditionalVatFieldIndex === -1) {
          updateSection(sectionIndex, {
            ...currentPayeeSection,
            section_field: [
              ...currentPayeeSection.section_field,
              initialFormSectionList[1].section_field[6],
            ],
          });
        }
        setValue(
          `sections.${sectionIndex}.section_field.${vatFieldIndex}.field_response`,
          vatValue
        );
        setValue(
          `sections.${sectionIndex}.section_field.${costFieldIndex}.field_response`,
          value - vatValue
        );
      } else {
        setValue(
          `sections.${sectionIndex}.section_field.${costFieldIndex}.field_response`,
          value
        );
      }
    } catch (e) {
      setValue(`sections.${sectionIndex}.section_field.4.field_response`, 0);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handlePayeeVatBooleanChange = (
    value: boolean,
    fieldIndex: number,
    sectionIndex: number
  ) => {
    try {
      const currentPayeeSection = getValues(`sections.${sectionIndex}`);
      const invoiceAmountField = currentPayeeSection.section_field.find(
        (field) => field.field_name === "Invoice Amount"
      );
      const invoiceAmount = Number(invoiceAmountField?.field_response);

      const vatFieldIndex = currentPayeeSection.section_field.findIndex(
        (field) => field.field_name === "VAT"
      );
      const costFieldIndex = currentPayeeSection.section_field.findIndex(
        (field) => field.field_name === "Cost"
      );

      const vatConditionalField = {
        ...initialFormSectionList[1].section_field[6],
        field_response: calculateInvoiceAmountWithVAT(invoiceAmount),
        field_section_duplicatable_id:
          invoiceAmountField?.field_section_duplicatable_id,
      };

      const updatedFields = [...currentPayeeSection.section_field];

      if (value) {
        // Add or update VAT field
        if (vatFieldIndex === -1) {
          updatedFields.push(vatConditionalField);
        } else {
          updatedFields[vatFieldIndex] = vatConditionalField;
        }
        setValue(
          `sections.${sectionIndex}.section_field.${costFieldIndex}.field_response`,
          invoiceAmount - vatConditionalField.field_response
        );
      } else {
        // Remove VAT field if it exists
        if (vatFieldIndex !== -1) {
          updatedFields.splice(vatFieldIndex, 1);
        }
        setValue(
          `sections.${sectionIndex}.section_field.${costFieldIndex}.field_response`,
          invoiceAmount
        );
      }

      updateSection(sectionIndex, {
        ...currentPayeeSection,
        section_field: updatedFields.sort(
          (a, b) => a.field_order - b.field_order
        ),
      });
    } catch (e) {
      setValue(
        `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`,
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
    fieldIndex: number,
    sectionIndex: number
  ) => {
    try {
      if (!value) return;

      const selectedSection = getValues(`sections.${sectionIndex}`);
      const paymentOptionField = {
        ...initialFormSectionList[2].section_field[1],
        field_option: bankListOptions,
      };

      const isWithAccountConditionalField = [
        "Bank Transfer",
        "E-Cash",
        "Telegraphic Transfer",
      ].includes(value);
      const isBankTransfer = value === "Bank Transfer";

      let updatedFields = selectedSection.section_field.filter(
        (field) =>
          !["Payment Option", "Account Name", "Account Number"].includes(
            field.field_name
          )
      );

      const conditionalFieldList =
        initialFormSectionList[2].section_field.filter((field) =>
          ["Account Name", "Account Number"].includes(field.field_name)
        );

      if (isWithAccountConditionalField) {
        const additionalFields = isBankTransfer
          ? [paymentOptionField, ...conditionalFieldList]
          : conditionalFieldList;

        updatedFields = [...updatedFields, ...additionalFields];
      }

      removeSection(sectionIndex);
      insertSection(
        sectionIndex,
        {
          ...selectedSection,
          section_field: updatedFields,
        },
        { focusName: `sections.${sectionIndex}.section_field.1.field_response` }
      );
    } catch (e) {
      setValue(
        `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`,
        ""
      );
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleTypeOfRequestChange = (
    value: string | null,
    sectionIndex: number
  ) => {
    try {
      const currentPayeeSection = getValues(`sections.${sectionIndex}`);
      const specifyOtherTypeOfRequestField =
        currentPayeeSection.section_field.find(
          (field) => field.field_name === "Specify Other Type of Request"
        );
      let currentPayeeSectionFieldList = currentPayeeSection.section_field;

      const addField = (fieldIndex: number) => {
        const selectedField =
          initialFormSectionList[1].section_field[fieldIndex];
        currentPayeeSectionFieldList = [
          ...currentPayeeSectionFieldList,
          selectedField,
        ];
      };

      const removeFieldById = (fieldId: string) => {
        currentPayeeSectionFieldList = currentPayeeSectionFieldList.filter(
          (field) => field.field_id !== fieldId
        );
      };

      if (value === "Other") {
        addField(3);
      } else if (specifyOtherTypeOfRequestField) {
        removeFieldById(specifyOtherTypeOfRequestField.field_id);
      } else if (value === "Materials") {
        const requestTypeValue = getValues(`sections`)[0].section_field[4]
          .field_response as string;
        const isLiquidation = requestTypeValue.includes("Liquidation");
        const rirNumberDoesNotExistInSection =
          !currentPayeeSectionFieldList.some(
            (field) => field.field_name === "RIR Number"
          );

        if (isLiquidation && rirNumberDoesNotExistInSection) {
          addField(8);
        }

        // add equipment code field
        const requestDetailsSection = getValues(`sections`)[0];
        const isPED =
          requestDetailsSection.section_field[2].field_response ===
          "Plants and Equipment";

        if (isPED) {
          const equipmentCodeField =
            initialFormSectionList[1].section_field.find(
              (field) => field.field_name === "Equipment Code"
            );
          const equipmentCodeFieldDoesNotExistInSection =
            !currentPayeeSectionFieldList.some(
              (field) => field.field_name === "Equipment Code"
            );
          if (equipmentCodeField && equipmentCodeFieldDoesNotExistInSection) {
            currentPayeeSectionFieldList = [
              ...currentPayeeSectionFieldList,
              { ...equipmentCodeField, field_option: equipmentCodeOptionList },
            ];
          }
        }
      }

      if (value !== "Materials") {
        // RIR number
        removeFieldById("15996ad6-e34e-4aa7-954b-565ed1c0ead0");
        // Equipment Code
        removeFieldById("8cd26ce7-0a5e-4199-b4c9-baaf32541b3a");
      }

      removeSection(sectionIndex);
      insertSection(
        sectionIndex,
        {
          ...currentPayeeSection,
          section_field: currentPayeeSectionFieldList.sort(
            (a, b) => a.field_order - b.field_order
          ),
        },
        { shouldFocus: false }
      );
    } catch (e) {
      setValue(`sections.${sectionIndex}.section_field.2.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleVatFieldChange = (value: number, sectionIndex: number) => {
    try {
      const currentPayeeSection = getValues(`sections.${sectionIndex}`);

      const costFieldIndex = currentPayeeSection.section_field.findIndex(
        (field) => field.field_name === "Cost"
      );
      const invoiceAmountIndex = currentPayeeSection.section_field.findIndex(
        (field) => field.field_name === "Invoice Amount"
      );
      setValue(
        `sections.${sectionIndex}.section_field.${costFieldIndex}.field_response`,
        Number(
          currentPayeeSection.section_field[invoiceAmountIndex].field_response
        ) - value
      );
      setIsUpdatedByAccountant(true);
    } catch (e) {
      setValue(`sections.${sectionIndex}.section_field.4.field_response`, 0);
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleFetchEquipmentCodeOptionList = async (fieldId: string) => {
    try {
      if (equipmentCodeOptionList.length > 0) return;

      const fetchedEquipmentCodeList: {
        equipment_description_id: string;
        equipment_description_property_number_with_prefix: string;
      }[] = [];

      let continueFetchingEquipmentCodeList = true;
      let index = 0;
      const limit = 500;

      while (continueFetchingEquipmentCodeList) {
        const currentBatch = await getPropertyNumberOptions(supabaseClient, {
          teamId: team.team_id,
          index,
          limit,
        });

        if (currentBatch.length > 0) {
          fetchedEquipmentCodeList.push(...currentBatch);
          index += limit;
        }

        continueFetchingEquipmentCodeList = currentBatch.length === limit;
      }

      const distinctEquipmentCodeList = fetchedEquipmentCodeList.reduce(
        (acc, current) => {
          const prefix =
            current.equipment_description_property_number_with_prefix;
          if (
            !acc.some(
              (item) =>
                item.equipment_description_property_number_with_prefix ===
                prefix
            )
          ) {
            acc.push(current);
          }
          return acc;
        },
        [] as {
          equipment_description_id: string;
          equipment_description_property_number_with_prefix: string;
        }[]
      );

      const equipmentCodeOptions = distinctEquipmentCodeList.map(
        (equipmentCode, index) => {
          return {
            option_field_id: fieldId,
            option_id: equipmentCode.equipment_description_id,
            option_order: index,
            option_value:
              equipmentCode.equipment_description_property_number_with_prefix,
          };
        }
      );
      setEquipmentCodeOptionList(equipmentCodeOptions);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch equipment code list. Please contact IT",
        color: "red",
      });
    }
  };

  const handleWorkingAdvancesChange = async (
    value: string | null,
    fieldIndex: number
  ) => {
    try {
      if (!value) return;
      const requestDetailsSection = getValues(`sections.0`);
      let updatedSectionFieldList = requestDetailsSection.section_field;
      const ticketIdIndex = requestDetailsSection.section_field.findIndex(
        (field) => field.field_id === "4e980cfe-c286-498c-a609-7bd246db8a9b"
      );
      if (value === "Petty Cash Fund Reimbursement" && ticketIdIndex > 0) {
        // remove ticket id field
        updatedSectionFieldList = requestDetailsSection.section_field.filter(
          (field) => field.field_id !== "4e980cfe-c286-498c-a609-7bd246db8a9b"
        );
      } else if (
        value !== "Petty Cash Fund Reimbursement" &&
        ticketIdIndex < 0
      ) {
        console.log("called");
        // add ticket id
        const ticketIdField = initialFormSectionList[0].section_field.find(
          (field) => field.field_id === "4e980cfe-c286-498c-a609-7bd246db8a9b"
        );
        if (!ticketIdField) return;
        updatedSectionFieldList = [...updatedSectionFieldList, ticketIdField];
      }

      updateSection(0, {
        ...requestDetailsSection,
        section_field: updatedSectionFieldList,
      });
    } catch (e) {
      setValue(`sections.0.section_field.${fieldIndex}.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  useEffect(() => {
    setIsLoading(true);
    if (!team.team_id) return;
    try {
      const fetchRequestDetails = async () => {
        // fetch equipment code list
        const equipmentCodeField = form.form_section[1].section_field.find(
          (field) => field.field_name === "Equipment Code"
        );
        await handleFetchEquipmentCodeOptionList(
          `${equipmentCodeField?.field_id}`
        );
        // Fetch response
        // Request Details Section
        const requestDetailsSectionResponse =
          await getNonDuplictableSectionResponse(supabaseClient, {
            requestId,
            fieldIdList: form.form_section[0].section_field.map(
              (field) => field.field_id
            ),
          });
        let requestDetailsSectionFieldList =
          form.form_section[0].section_field.map((field) => {
            const response = requestDetailsSectionResponse.find(
              (response) =>
                response.request_response_field_id === field.field_id
            );
            return {
              ...field,
              field_response: response
                ? safeParse(response.request_response)
                : "",
              field_is_read_only: canEditVatField,
            };
          });

        const isPED = requestDetailsSectionFieldList.some(
          (field) =>
            field.field_id === "041579d9-aff1-4508-a5a7-ac20e7bc7cb7" &&
            field.field_response === "Plants and Equipment"
        );

        const requestTypeResponse = safeParse(
          `${
            requestDetailsSectionFieldList.find(
              (field) => field.field_name === "Request Type"
            )?.field_response
          }`
        );

        const requestTypeWithWAV = ["liquidation", "petty cash fund"];

        const isLiquidationOrPCF = requestTypeWithWAV.some((type) =>
          requestTypeResponse.toLowerCase().includes(type)
        );

        if (!isLiquidationOrPCF) {
          requestDetailsSectionFieldList =
            requestDetailsSectionFieldList.filter(
              (field) =>
                !["Working Advances", "Ticket ID"].includes(field.field_name)
            );
        }

        if (!isPED) {
          requestDetailsSectionFieldList =
            requestDetailsSectionFieldList.filter(
              (field) => !["Equipment Code"].includes(field.field_name)
            );
        }

        // Payee Section
        let index = 0;
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
          section.section_field.forEach((field) => {
            const response = field.field_response?.request_response
              ? safeParse(field.field_response?.request_response)
              : "";
            let option: OptionTableRow[] = field.field_option ?? [];
            let isReadOnly = field.field_is_read_only;

            if (field.field_name === "Payment Option") {
              option = bankListOptions;
            }

            if (field.field_name === "Equipment Code") {
              option = equipmentCodeOptionList;
            }

            if (canEditVatField) {
              if (field.field_name === "VAT") {
                isReadOnly = false;
              } else {
                isReadOnly = true;
              }
            }

            if (response) {
              fieldList.push({
                ...field,
                field_response: response,
                field_option: option,
                field_is_read_only: isReadOnly,
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

        const paymentSectionResponse = await getNonDuplictableSectionResponse(
          supabaseClient,
          {
            requestId,
            fieldIdList: form.form_section[2].section_field.map(
              (field) => field.field_id
            ),
          }
        );

        let paymentSectionFieldList = form.form_section[2].section_field.map(
          (field) => {
            const response = paymentSectionResponse.find(
              (response) =>
                response.request_response_field_id === field.field_id
            );

            let fieldOption: OptionTableRow[] = field.field_option;
            if (field.field_name === "Payment Option") {
              fieldOption = bankListOptions;
            }

            return {
              ...field,
              field_response: response
                ? safeParse(response.request_response)
                : "",
              field_is_read_only: canEditVatField,
              field_option: fieldOption,
            };
          }
        );

        const modeOfPaymentResponse = paymentSectionFieldList[0].field_response;
        const isWithAccountConditionalField = [
          "Bank Transfer",
          "E-Cash",
          "Telegraphic Transfer",
        ].includes(modeOfPaymentResponse);
        const isBankTransfer = modeOfPaymentResponse === "Bank Transfer";

        if (isWithAccountConditionalField) {
          if (!isBankTransfer) {
            paymentSectionFieldList = paymentSectionFieldList.filter(
              (field) => field.field_name !== "Payment Option"
            );
          }
        } else {
          paymentSectionFieldList = [paymentSectionFieldList[0]];
        }

        // fetch additional signer
        handleProjectNameChange(
          requestDetailsSectionFieldList[0].field_response
        );

        const finalInitialRequestDetails = [
          {
            ...form.form_section[0],
            section_field: requestDetailsSectionFieldList,
          },
          ...sectionWithDuplicatableId,
          { ...form.form_section[2], section_field: paymentSectionFieldList },
        ].filter((section) =>
          requestTypeResponse === "Liquidation"
            ? section.section_name !== "Payment"
            : true
        );

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
                    liquidationReimbursementFormMethods={{
                      onProjectNameChange: handleProjectNameChange,
                      onRequestTypeChange: handleRequestTypeChange,
                      onTypeOfRequestChange: handleTypeOfRequestChange,
                      onPayeeVatBooleanChange: handlePayeeVatBooleanChange,
                      onInvoiceAmountChange: handleInvoiceAmountChange,
                      onModeOfPaymentChange: handleModeOfPaymentChange,
                      onVatFieldChange: handleVatFieldChange,
                      onWorkingAdvancesChange: handleWorkingAdvancesChange,
                    }}
                    formslyFormName={form.form_name}
                    isEdit={!isReferenceOnly}
                  />
                  {section.section_is_duplicatable &&
                    !canEditVatField &&
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

export default EditLiquidReimbursementRequestPage;
