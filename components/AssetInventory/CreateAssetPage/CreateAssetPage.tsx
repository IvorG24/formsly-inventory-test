import { getLocationOption, getSubFieldOrCustomField } from "@/backend/api/get";
import { createAssetRequest, getItemOption } from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { FETCH_OPTION_LIMIT } from "@/utils/constant";
import { formatTeamNameToUrlKey } from "@/utils/string";
import {
  FormType,
  InventoryFormResponseType,
  InventoryFormType,
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
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import InventoryFormSection from "./InventoryFormSection";

export type Section = InventoryFormResponseType["form_section"][0];

export type InventoryFormValues = {
  sections: Section[];
};

export type FieldWithResponseArray =
  FormType["form_section"][0]["section_field"][0] & {
    field_response: RequestResponseTableRow[];
  };

type Props = {
  form: InventoryFormType;
  formslyFormName?: string;
  requestProjectId?: string;
};

const CreateAssetPage = ({ form, formslyFormName = "" }: Props) => {
  const teamMember = useUserTeamMember();
  const activeTeam = useActiveTeam();
  const router = useRouter();
  const requestorProfile = useUserProfile();
  const supabaseClient = useSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };

  const requestFormMethods = useForm<InventoryFormValues>();
  const { handleSubmit, control, getValues, setValue } = requestFormMethods;
  const {
    fields: formSections,
    remove: removeSection,
    replace: replaceSection,
    update: updateSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  const handleCreateRequest = async (data: InventoryFormValues) => {
    try {
      if (!requestorProfile) return;
      if (!teamMember) return;

      setIsLoading(true);

      const assetData = await createAssetRequest(supabaseClient, {
        InventoryFormValues: data,
        formId: form.form_id,
        teamId: activeTeam.team_id,
        teamMemberId: teamMember.team_member_id,
        formName: form.form_name,
        teamName: activeTeam.team_name,
      });

      notifications.show({
        message: "Asset created.",
        color: "green",
      });
      router.push(
        `/${formatTeamNameToUrlKey(activeTeam.team_name)}/inventory/${assetData.inventory_request_tag_id}`
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

  const handleOnCategoryNameChange = async (
    index: number,
    value: string | null
  ) => {
    try {
      const categorySection = getValues(`sections.${index}`);
      if (value === null) {
        setValue(`sections.${index}.section_field.${0}.field_response`, "");
        updateSection(index, {
          ...categorySection,
          section_field: form.form_section[1].section_field,
        });
        return;
      }
      const { subFields, customFields } = await getSubFieldOrCustomField(
        supabaseClient,
        {
          categoryName: value,
        }
      );
      const newSectionField = [
        categorySection.section_field[0],
        ...subFields,
        ...customFields,
      ];

      updateSection(index, {
        ...categorySection,
        section_field: newSectionField as Omit<
          (typeof categorySection.section_field)[0],
          "field_special_field_template_id"
        >[],
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later hey.",
        color: "red",
      });
    }
  };

  const handleOnSiteNameChange = async (
    index: number,
    value: string | null
  ) => {
    try {
      const siteLocationSection = getValues(`sections.${index}`);
      if (value === null) {
        setValue(`sections.${index}.section_field.${0}.field_response`, "");
        updateSection(index, {
          ...siteLocationSection,
          section_field: form.form_section[2].section_field,
        });
        return;
      }

      const data = await getLocationOption(supabaseClient, {
        siteName: value,
      });

      const optionList = data.map((option, index) => ({
        option_id: option.location_id,
        option_value: option.location_name,
        option_order: index,
        option_field_id: siteLocationSection.section_field[1].field_id,
      }));
      const newSectionField = [
        siteLocationSection.section_field[0],

        {
          ...siteLocationSection.section_field[1],
          field_option: optionList,
        },
        {
          ...siteLocationSection.section_field[2],
        },
      ];

      updateSection(index, {
        ...siteLocationSection,
        section_field: newSectionField as Omit<
          (typeof siteLocationSection.section_field)[0],
          "field_special_field_template_id"
        >[],
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later hey.",
        color: "red",
      });
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

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        if (!activeTeam.team_id) return;
        const itemOptionList: OptionTableRow[] = [];
        while (1) {
          const itemData = await getItemOption(supabaseClient, {
            teamId: activeTeam.team_id,
          });
          const itemOptions = itemData.map((item, index) => {
            return {
              option_field_id: form.form_section[0].section_field[0].field_id,
              option_id: item.item_id,
              option_order: index,
              option_value: item.value,
            };
          });
          itemOptionList.push(...itemOptions);

          if (itemData.length < FETCH_OPTION_LIMIT) break;
        }

        replaceSection([
          {
            ...form.form_section[0],
            section_field: [
              {
                ...form.form_section[0].section_field[0],
                field_option: itemOptionList,
              },
              ...form.form_section[0].section_field.slice(1, 7),
            ],
          },
          form.form_section[1],
          form.form_section[2],
          form.form_section[3],
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

  return (
    <Container>
      <LoadingOverlay visible={isLoading} />
      <Title order={2} color="dimmed">
        Create Asset
      </Title>
      <Space h="md" />
      <FormProvider {...requestFormMethods}>
        <form onSubmit={handleSubmit(handleCreateRequest)}>
          <Stack spacing="xl">
            <RequestFormDetails formDetails={formDetails} />
            {formSections.map((section, idx) => {
              return (
                <Box key={section.id}>
                  <InventoryFormSection
                    key={section.section_id}
                    section={section}
                    sectionIndex={idx}
                    onRemoveSection={handleRemoveSection}
                    formslyFormName={formslyFormName}
                    assetFormMethods={{
                      onCategoryNameChange: handleOnCategoryNameChange,
                      onSiteNameChange: handleOnSiteNameChange,
                    }}
                  />
                </Box>
              );
            })}

            <Button type="submit">Submit</Button>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default CreateAssetPage;
