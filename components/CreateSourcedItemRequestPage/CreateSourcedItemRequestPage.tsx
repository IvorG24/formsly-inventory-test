import {
  checkItemQuantity,
  getMultipleProjectSignerWithTeamMember,
} from "@/backend/api/get";
import { createRequest } from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import RequestFormSigner from "@/components/CreateRequestPage/RequestFormSigner";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { areEqual } from "@/utils/arrayFunctions/arrayFunctions";
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
  List,
  LoadingOverlay,
  Space,
  Stack,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
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
  itemOptions: OptionTableRow[];
  requestProjectId: string;
  requestingProject: string;
};

const CreateSourcedItemRequestPage = ({
  form,
  itemOptions,
  requestProjectId,
  requestingProject,
}: Props) => {
  const router = useRouter();
  const formId = router.query.formId as string;
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const requestorProfile = useUserProfile();
  const { setIsLoading } = useLoadingActions();
  const activeTeam = useActiveTeam();

  const [isFetchingSigner, setIsFetchingSigner] = useState(false);
  const [previousProjectSite, setPreviousProjetcSite] = useState<string[]>([]);

  const initialSignerList = form.form_signer.map((signer) => ({
    ...signer,
    signer_action: signer.signer_action.toUpperCase(),
  }));

  const [signerList, setSignerList] =
    useState<FormType["form_signer"]>(initialSignerList);

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };

  const requestFormMethods = useForm<RequestFormValues>();
  const { handleSubmit, setValue, control, getValues } = requestFormMethods;
  const {
    fields: formSections,
    insert: insertSection,
    remove: removeSection,
    replace: replaceSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  useEffect(() => {
    replaceSection(form.form_section);

    const newFields = form.form_section[1].section_field.map((field) => {
      if (field.field_name === "Item") {
        return {
          ...field,
          field_option: itemOptions,
        };
      } else {
        return field;
      }
    });
    replaceSection([
      form.form_section[0],
      {
        ...form.form_section[1],
        section_field: newFields,
      },
    ]);
    setValue(
      `sections.${0}.section_field.${0}.field_response`,
      router.query.itemId
    );
  }, [form, replaceSection, requestFormMethods, itemOptions]);

  const handleCreateRequest = async (data: RequestFormValues) => {
    try {
      if (!requestorProfile || !teamMember) return;
      setIsLoading(true);

      const itemID = JSON.stringify(
        data.sections[0].section_field[0].field_response
      );

      const tempRequestId = uuidv4();

      const itemFieldList: RequestResponseTableRow[] = [];
      const quantityFieldList: RequestResponseTableRow[] = [];

      const mergedSection: Section[] = [];
      const itemNameList: string[] = [];

      data.sections.slice(1).forEach((section) => {
        const itemIndex = itemNameList.indexOf(
          `${section.section_field[0].field_response}`
        );
        if (itemIndex === -1) {
          mergedSection.push(section);
          itemNameList.push(`${section.section_field[0].field_response}`);
        } else {
          const sum =
            Number(mergedSection[itemIndex].section_field[1].field_response) +
            Number(section.section_field[1].field_response);
          mergedSection[itemIndex].section_field[1].field_response = sum;
        }
      });

      mergedSection.forEach((section) => {
        section.section_field.forEach((field) => {
          if (field.field_name === "Item") {
            itemFieldList.push({
              request_response_id: uuidv4(),
              request_response: JSON.stringify(field.field_response),
              request_response_duplicatable_section_id: null,
              request_response_field_id: field.field_id,
              request_response_request_id: tempRequestId,
            });
          } else if (field.field_name === "Quantity") {
            quantityFieldList.push({
              request_response_id: uuidv4(),
              request_response: JSON.stringify(field.field_response),
              request_response_duplicatable_section_id: null,
              request_response_field_id: field.field_id,
              request_response_request_id: tempRequestId,
            });
          }
        });
      });

      const warningItemList = await checkItemQuantity(supabaseClient, {
        itemID,
        itemFieldList,
        quantityFieldList,
      });

      if (warningItemList && warningItemList.length !== 0) {
        modals.open({
          title: "You cannot create this request.",
          centered: true,
          children: (
            <Box maw={390}>
              <Title order={5}>
                There are items that will exceed the quantity limit of the Item
              </Title>
              <List size="sm" mt="md" spacing="xs">
                {warningItemList.map((item) => (
                  <List.Item key={item}>{item}</List.Item>
                ))}
              </List>
              <Button fullWidth onClick={() => modals.closeAll()} mt="md">
                Close
              </Button>
            </Box>
          ),
        });
      } else {
        const mergedSectionInput: Section[] = [];
        const itemNameListInput: string[] = [];

        const sectionData = getValues("sections");

        sectionData.slice(1).forEach((section) => {
          const inputIndex = itemNameListInput.indexOf(
            `${section.section_field[0].field_response}+${section.section_field[2].field_response}`
          );

          if (inputIndex === -1) {
            mergedSectionInput.push(section);
            itemNameListInput.push(
              `${section.section_field[0].field_response}+${section.section_field[2].field_response}`
            );
          } else {
            const sum =
              Number(
                mergedSectionInput[inputIndex].section_field[1].field_response
              ) + Number(section.section_field[1].field_response);
            mergedSectionInput[inputIndex].section_field[1].field_response =
              sum;
          }
        });

        const request = await createRequest(supabaseClient, {
          requestFormValues: {
            sections: [data.sections[0], ...mergedSectionInput],
          },
          formId,
          teamMemberId: teamMember.team_member_id,
          signers: signerList,
          teamId: teamMember.team_member_team_id,
          requesterName: `${requestorProfile.user_first_name} ${requestorProfile.user_last_name}`,
          formName: form.form_name,
          isFormslyForm: true,
          projectId: requestProjectId,
          teamName: formatTeamNameToUrlKey(activeTeam.team_name ?? ""),
          userId: requestorProfile.user_id,
        });

        notifications.show({
          message: "Request created.",
          color: "green",
        });
        await router.push(
          `/${formatTeamNameToUrlKey(activeTeam.team_name ?? "")}/requests/${
            request.request_id
          }`
        );
      }
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
        (field) => {
          if (field.field_name === "Item") {
            return {
              ...field,
              field_option: itemOptions,
              field_section_duplicatable_id: sectionDuplicatableId,
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
    }
    handleProjectSiteChange();
  };

  const handleProjectSiteChange = async () => {
    const sectionList = getValues(`sections`);
    const itemSectionList = sectionList.slice(1);

    const currentProjectSiteList = [
      ...new Set(
        itemSectionList.map(
          (section) => section.section_field[2].field_response
        )
      ),
    ].filter((project) => project !== null);
    const previousProjectSiteList = [...new Set(previousProjectSite)].filter(
      (project) => project !== null
    );

    if (
      areEqual(
        currentProjectSiteList as string[],
        previousProjectSiteList as string[]
      )
    )
      return;

    setIsFetchingSigner(true);
    const newSignerList = currentProjectSiteList as string[];
    setPreviousProjetcSite(newSignerList);
    const data = await getMultipleProjectSignerWithTeamMember(supabaseClient, {
      formId: form.form_id,
      projectName: newSignerList,
    });
    const formattedData = data as unknown as FormType["form_signer"];

    const teamMemberIdList = [
      ...initialSignerList.map(
        (signer) => signer.signer_team_member.team_member_id
      ),
    ];
    const finalSigners = [...initialSignerList];

    formattedData.forEach((signer) => {
      if (
        !teamMemberIdList.includes(signer.signer_team_member.team_member_id)
      ) {
        teamMemberIdList.push(signer.signer_team_member.team_member_id);
        finalSigners.push({
          ...signer,
          signer_is_primary_signer: false,
          signer_action: signer.signer_action.toUpperCase(),
        } as FormType["form_signer"][0]);
      }
    });
    setSignerList(finalSigners);

    try {
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
            <RequestFormDetails
              formDetails={formDetails}
              requestingProject={requestingProject}
            />
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
                    formslyFormName={form.form_name}
                    onRemoveSection={handleRemoveSection}
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
            <Button type="submit" disabled={isFetchingSigner}>
              Submit
            </Button>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default CreateSourcedItemRequestPage;
