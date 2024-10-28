import {
  getEmployeeName,
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
import { handleRemoveFocus } from "@/utils/functions";
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

export type CentralOfficeDepartmentType =
  | "ACCOUNTING"
  | "ADMINISTRATION"
  | "BUSINESS DEVELOPMENT"
  | "FINANCE"
  | "HUMAN RESOURCES"
  | "INFORMATION TECHNOLOGY"
  | "INTERNAL AUDIT"
  | "LEGAL"
  | "LOGISTICS"
  | "OFFICE OF THE PRESIDENT"
  | "OPERATIONS MANAGEMENT GROUP"
  | "PED"
  | "PROJECT CONTROL"
  | "PURCHASING"
  | "QESH"
  | "TENDERING"
  | "SECURITY"
  | "TREASURY"
  | "WAREHOUSE";

export const CENTRAL_OFFICE_DEPARTMENT_CODE_MAP = {
  ACCOUNTING: "D18-000006B",
  ADMINISTRATION: "D16-000001",
  "BUSINESS DEVELOPMENT": "D16-000024",
  FINANCE: "D16-000005",
  "HUMAN RESOURCES": "D16-000006",
  "INFORMATION TECHNOLOGY": "D16-000012",
  "INTERNAL AUDIT": "D16-000002",
  LEGAL: "D16-000010",
  LOGISTICS: "D16-000011",
  "OFFICE OF THE PRESIDENT": "D16-000013",
  "OPERATIONS MANAGEMENT GROUP": "D16-000014",
  PED: "D16-000015",
  "PROJECT CONTROL": "D18-000005",
  PURCHASING: "D16-000016",
  QESH: "D16-000022",
  SECURITY: "D16-000018",
  TENDERING: "D18-000003",
  TREASURY: "D18-000006A",
  WAREHOUSE: "D16-000021",
};

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
  departmentOptions: OptionTableRow[];
  allProjectOptions: OptionTableRow[];
};

const CreateRequestForPaymentPage = ({
  form,
  projectOptions,
  departmentOptions,
  allProjectOptions,
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
    replace: replaceSection,
    remove: removeSection,
    insert: insertSection,
    update: updateSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  const [isFetchingSigner, setIsFetchingSigner] = useState(false);
  const [signerList, setSignerList] = useState(
    form.form_signer.map((signer) => ({
      ...signer,
      signer_action: signer.signer_action.toUpperCase(),
    }))
  );
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

    const sectionDuplicatableId = uuidv4();
    const duplicatedFieldsWithDuplicatableId = sectionMatch.section_field.map(
      (field) => {
        if (field.field_name === "Project / Department") {
          const options = getValues("sections.2.section_field.2.field_option");
          return {
            ...field,
            field_section_duplicatable_id: sectionDuplicatableId,
            field_option: options,
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

  const resetSigner = () => {
    setSignerList(
      form.form_signer.map((signer) => ({
        ...signer,
        signer_action: signer.signer_action.toUpperCase(),
      }))
    );
  };

  const resetSection = () => {
    replaceSection([
      {
        ...form.form_section[0],
        section_field: [
          ...form.form_section[0].section_field.slice(0, 2),
          ...form.form_section[0].section_field.slice(5, 9),
        ],
      },
      {
        ...form.form_section[1],
        section_field: [
          form.form_section[1].section_field[3],
          form.form_section[1].section_field[5],
        ],
      },
      ...form.form_section.slice(2, 4),
      {
        ...form.form_section[4],
        section_field: [form.form_section[4].section_field[0]],
      },
    ]);
  };

  useEffect(() => {
    resetSection();
  }, [form, requestFormMethods]);

  const handleProjectNameChange = async (value: string | null) => {
    resetSection();
    try {
      setIsFetchingSigner(true);
      setLoadingFieldList([
        {
          sectionIndex: 0,
          fieldIndex: 0,
        },
      ]);
      removeSection(0);
      if (value) {
        if (value.includes("CENTRAL OFFICE")) {
          const department = value.split(" - ")[1];
          const departmentCode =
            CENTRAL_OFFICE_DEPARTMENT_CODE_MAP[
              department as unknown as CentralOfficeDepartmentType
            ];
          const isPed = department === "PED";

          insertSection(0, {
            ...form.form_section[0],
            section_field: [
              {
                ...form.form_section[0].section_field[0],
                field_response: value,
              },
              {
                ...form.form_section[0].section_field[1],
                field_response: department,
                field_option: [
                  {
                    option_id: uuidv4(),
                    option_value: department,
                    option_order: 1,
                    option_field_id:
                      form.form_section[0].section_field[1].field_id,
                  },
                ],
                field_is_read_only: true,
              },
              {
                ...form.form_section[0].section_field[2],
                field_response: departmentCode,
              },
              ...form.form_section[0].section_field.slice(isPed ? 3 : 5, 9),
            ],
          });
          setTimeout(
            () =>
              setFocus(
                `sections.0.section_field.${isPed ? 3 : 2}.field_response`
              ),
            0
          );
        } else {
          insertSection(0, {
            ...form.form_section[0],
            section_field: [
              {
                ...form.form_section[0].section_field[0],
                field_response: value,
              },
              form.form_section[0].section_field[1],
              ...form.form_section[0].section_field.slice(5, 9),
            ],
          });
          setTimeout(
            () => setFocus(`sections.0.section_field.0.field_response`),
            0
          );
        }

        const projectId = projectOptions.find(
          (option) => option.option_value === value
        )?.option_id;
        if (projectId) {
          const data = await getProjectSignerWithTeamMember(supabaseClient, {
            projectId,
            formId,
            requesterTeamMemberId: `${teamMember?.team_member_id}`,
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
      setLoadingFieldList([]);
      setIsFetchingSigner(false);
    }
  };

  const handleDepartmentChange = async (
    value: string | null,
    prevValue: string | null
  ) => {
    const newSection = getValues("sections.0");
    try {
      setLoadingFieldList([
        {
          sectionIndex: 0,
          fieldIndex: 1,
        },
      ]);
      if (value === "Plants and Equipment") {
        updateSection(0, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 2),
            ...form.form_section[0].section_field.slice(3, 5),
            ...newSection.section_field.slice(2),
          ],
        });
      } else if (prevValue === "Plants and Equipment") {
        updateSection(0, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 2),
            ...newSection.section_field.slice(4),
          ],
        });
      }
    } catch (e) {
      setValue(`sections.0.section_field.1.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handlePayeeTypeChange = async (
    value: string | null,
    prevValue: string | null
  ) => {
    const headerSection = getValues("sections.0");
    const paymentInformationSection = getValues("sections.1");

    const payeeTypeIndex = headerSection.section_field
      .map((field) => field.field_name)
      .indexOf("Payee Type");
    try {
      setLoadingFieldList([
        {
          sectionIndex: 0,
          fieldIndex: payeeTypeIndex,
        },
      ]);

      if (prevValue) {
        if (prevValue === "Employee") {
          removeSection(1);
          insertSection(1, {
            ...paymentInformationSection,
            section_field: paymentInformationSection.section_field.slice(2),
          });
        } else if (prevValue === "Individual") {
          removeSection(1);
          insertSection(1, {
            ...paymentInformationSection,
            section_field: paymentInformationSection.section_field.slice(1),
          });
        } else if (prevValue === "Business") {
          removeSection([0, 1]);
          insertSection(0, {
            ...headerSection,
            section_field: headerSection.section_field.slice(0, -1),
          });
          insertSection(1, {
            ...paymentInformationSection,
            section_field: paymentInformationSection.section_field.slice(1),
          });
        }
      }

      if (value) {
        const headerSection = getValues("sections.0");
        const paymentInformationSection = getValues("sections.1");
        if (value === "Employee") {
          removeSection(1);
          insertSection(1, {
            ...paymentInformationSection,
            section_field: [
              ...form.form_section[1].section_field.slice(0, 2),
              ...paymentInformationSection.section_field,
            ],
          });
          setTimeout(
            () => setFocus(`sections.1.section_field.0.field_response`),
            0
          );
        } else if (value === "Individual") {
          removeSection(1);
          insertSection(1, {
            ...paymentInformationSection,
            section_field: [
              form.form_section[1].section_field[2],
              ...paymentInformationSection.section_field,
            ],
          });
          setTimeout(
            () => setFocus(`sections.1.section_field.0.field_response`),
            0
          );
        } else if (value === "Business") {
          removeSection([0, 1]);
          insertSection(0, {
            ...headerSection,
            section_field: [
              ...headerSection.section_field,
              form.form_section[0].section_field[9],
            ],
          });
          insertSection(1, {
            ...paymentInformationSection,
            section_field: [
              form.form_section[1].section_field[2],
              ...paymentInformationSection.section_field,
            ],
          });
          setTimeout(() => handleRemoveFocus(), 0);
        }
      }
    } catch (e) {
      setValue(`sections.0.section_field.${payeeTypeIndex}.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleEmployeeNumberChange = async (value: string | null) => {
    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: 1, fieldIndex: 1 }]);

        const employee = await getEmployeeName(supabaseClient, {
          employeeId: value,
        });

        if (employee) {
          setValue(
            `sections.${1}.section_field.1.field_response`,
            `${employee.scic_employee_first_name} ${
              employee.scic_employee_middle_name
            } ${employee.scic_employee_last_name} ${
              employee.scic_employee_suffix ?? ""
            }`
          );
        } else {
          setValue(`sections.${1}.section_field.0.field_response`, "");
          setValue(`sections.${1}.section_field.1.field_response`, "");
          notifications.show({
            message: `There's no employee with HRIS ${value}`,
            color: "orange",
          });
          return;
        }
      } else {
        setValue(`sections.${1}.section_field.0.field_response`, "");
        setValue(`sections.${1}.section_field.1.field_response`, "");
      }
    } catch (e) {
      setValue(`sections.${1}.section_field.0.field_response`, "");
      setValue(`sections.${1}.section_field.1.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handlePurposePlanChange = async (
    value: string | null,
    prevValue: string | null
  ) => {
    const newSection = getValues("sections.1");
    const purposeOfPaymentIndex = newSection.section_field
      .map((field) => field.field_name)
      .indexOf("Purpose of Payment");
    try {
      setLoadingFieldList([
        {
          sectionIndex: 0,
          fieldIndex: purposeOfPaymentIndex,
        },
      ]);

      if (value === "OB BUDGET") {
        updateSection(1, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, purposeOfPaymentIndex + 1),
            form.form_section[1].section_field[4],
            ...newSection.section_field.slice(purposeOfPaymentIndex + 1),
          ],
        });
      } else if (prevValue === "OB BUDGET") {
        updateSection(1, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, purposeOfPaymentIndex + 1),
            ...newSection.section_field.slice(purposeOfPaymentIndex + 2),
          ],
        });
      }
    } catch (e) {
      setValue(
        `sections.1.section_field.${purposeOfPaymentIndex}.field_response`,
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

  const handleChargeToChange = async (value: string | null) => {
    const sectionList = getValues("sections");
    const paymentInformationSection = getValues("sections.1");
    const chargeToIndex = paymentInformationSection.section_field
      .map((field) => field.field_name)
      .indexOf("Charge To");
    try {
      setLoadingFieldList([
        {
          sectionIndex: 1,
          fieldIndex: chargeToIndex,
        },
      ]);
      sectionList.forEach((section, index) => {
        if (section.section_name !== "Request") return;
        let newOption: OptionTableRow[] = [];
        if (value === "Project") {
          newOption = allProjectOptions.filter(
            (project) => !project.option_value.includes("CENTRAL OFFICE")
          );
        } else if (value === "Various Department") {
          newOption = departmentOptions;
        }
        updateSection(index, {
          ...section,
          section_field: [
            ...section.section_field.slice(0, 2),
            {
              ...section.section_field[2],
              field_option: newOption,
            },
          ],
        });
      });
    } catch (e) {
      setValue(`sections.1.section_field.${chargeToIndex}.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleAmountBlur = async (value: string | null, index: number) => {
    const sectionList = getValues("sections");
    const requestTotalSectionIndex = sectionList
      .map((section) => section.section_name)
      .indexOf("Request Total");
    const requestTotalSection = sectionList[requestTotalSectionIndex];
    try {
      if (!requestTotalSection) throw new Error();
      setLoadingFieldList([
        { sectionIndex: requestTotalSectionIndex, fieldIndex: 0 },
      ]);
      let total = 0;
      sectionList.forEach((section) => {
        if (section.section_name === "Request") {
          total += Number(section.section_field[1].field_response ?? 0);
        }
      });
      setValue(
        `sections.${requestTotalSectionIndex}.section_field.0.field_response`,
        total
      );
    } catch (e) {
      setValue(`sections.1.section_field.${index}.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleModeOfPaymentChange = async (
    value: string | null,
    index: number
  ) => {
    const newSection = getValues(`sections.${index}`);
    try {
      setLoadingFieldList([
        {
          sectionIndex: index,
          fieldIndex: 0,
        },
      ]);
      const newFields = [newSection.section_field[0]];
      if (value && ["E-Cash", "Telegraphic Transfer"].includes(value)) {
        newFields.push(...form.form_section[4].section_field.slice(2, 4));
      } else if (value === "Bank Transfer") {
        newFields.push(...form.form_section[4].section_field.slice(1, 4));
      }
      updateSection(index, {
        ...newSection,
        section_field: newFields,
      });
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
                    requestForPaymentFormMethods={{
                      onProjectNameChange: handleProjectNameChange,
                      onDepartmentChange: handleDepartmentChange,
                      onPayeeTypeChange: handlePayeeTypeChange,
                      onEmployeeNumberChange: handleEmployeeNumberChange,
                      onPurposePlanChange: handlePurposePlanChange,
                      onChargeToChange: handleChargeToChange,
                      onAmountBlur: handleAmountBlur,
                      onModeOfPaymentChange: handleModeOfPaymentChange,
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
            <Button type="submit">Submit</Button>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default CreateRequestForPaymentPage;
