import { getInventoryFormDetails, getLocationOption } from "@/backend/api/get";
import { updateEvent } from "@/backend/api/update";
import { useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import {
  FormType,
  InventoryFormResponseType,
  InventoryFormType,
  RequestResponseTableRow,
  TeamMemberWithUserType,
} from "@/utils/types";
import { Box, Button, Group, Modal, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import InventoryFormSection from "./CreateAssetPage/InventoryFormSection";

export type Section = InventoryFormResponseType["form_section"][0];

export type InventoryFormValues = {
  sections: Section[];
};

export type FieldWithResponseArray =
  FormType["form_section"][0]["section_field"][0] & {
    field_response: RequestResponseTableRow[];
  };

type Props = {
  eventId: string;
  userId: string;
  selectedRow: string[];
  teamMemberList: TeamMemberWithUserType[];
  handleFilterForms: () => void;
};

const EventFormModal = ({
  eventId,
  userId,
  selectedRow,
  teamMemberList,
  handleFilterForms,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMember = useUserTeamMember();
  const requestFormMethods = useForm<InventoryFormValues>();
  const [opened, setOpened] = useState(true);

  const [formData, setFormData] = useState<InventoryFormType>();
  const { handleSubmit, control, getValues, setValue } = requestFormMethods;
  const {
    fields: formSections,
    replace: replaceSection,
    update: updateSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  const onSubmit = async (data: InventoryFormValues) => {
    try {
      await updateEvent(supabaseClient, {
        updateResponse: data,
        selectedRow,
        teamMemberId: teamMember?.team_member_id,
        type: formData?.form_name ?? "",
      });
      setOpened(false);
      handleFilterForms();
      notifications.show({
        message: "Event Submitted",
        color: "green",
      });
    } catch (e) {
      console.log(e);

      notifications.show({
        message: "Something went wrong",
        color: "red",
      });
    }
  };

  useEffect(() => {
    const getInventoryForm = async () => {
      try {
        if (!userId || !eventId) return;

        const params = { eventId, userId };

        const form = await getInventoryFormDetails(supabaseClient, params);

        replaceSection([
          {
            ...form.form_section[0],
          },
        ]);
        setFormData(form);
      } catch (e) {
        notifications.show({
          message: "Something went wrong",
          color: "red",
        });
      }
    };

    getInventoryForm();
  }, [userId, eventId, replaceSection, opened]);

  const handleOnEventCategoryChange = async (
    index: number,
    value: string | null
  ) => {
    try {
      const categorySection = getValues(`sections.${index}`);
      const params = { eventId, userId };

      const form = await getInventoryFormDetails(supabaseClient, params);
      const teamMemberOption = teamMemberList.map((member, index) => ({
        option_id: member.team_member_id,
        option_value: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
        option_order: index,
        option_field_id: form.form_section[1].section_field[0].field_id,
      }));
      if (value === null) {
        replaceSection([
          {
            ...form.form_section[0],
          },
        ]);
        return;
      }

      let newSectionField = [...categorySection.section_field];

      if (value === "Site") {
        newSectionField = [
          categorySection.section_field[0],
          ...form.form_section[2].section_field,
        ];
      } else if (value === "Person") {
        newSectionField = [
          {
            ...categorySection.section_field[0],
          },
          {
            ...form.form_section[1].section_field[0],
            field_option: teamMemberOption,
          },

          ...form.form_section[1].section_field.slice(1, 7),
        ];
      }
      updateSection(index, {
        ...categorySection,
        section_field: newSectionField as typeof categorySection.section_field,
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
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
      const params = { eventId, userId };
      const form = await getInventoryFormDetails(supabaseClient, params);
      if (value === null) {
        setValue(`sections.${index}.section_field.${0}.field_response`, "");
        updateSection(index, {
          ...siteLocationSection,
          section_field: form.form_section[index].section_field,
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
      const newSectionField = siteLocationSection.section_field.map((field) => {
        if (field.field_name === "Location") {
          return {
            ...field,
            field_option: optionList,
          };
        }
        return { ...field };
      });

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
  const formisEmpty = formData && formData.form_section.length > 0;
  return (
    <>
      <Modal
        opened={formisEmpty ? opened : false}
        onClose={() => setOpened(false)}
        size="xl"
      >
        <Title order={3}>Event Form</Title>
        <FormProvider {...requestFormMethods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {formSections.map((section, idx) => {
              const sectionFields = section.section_field || [];

              return (
                <Box key={section.section_id}>
                  <InventoryFormSection
                    type="Modal"
                    key={section.section_id}
                    section={{
                      ...section,
                      section_field: sectionFields,
                    }}
                    eventFormMethods={{
                      onCheckinCategoryChange: handleOnEventCategoryChange,
                      onSiteCategorychange: handleOnSiteNameChange,
                    }}
                    sectionIndex={idx}
                  />
                </Box>
              );
            })}
            <Group position="right" mt="md">
              <Button fullWidth type="submit">
                Submit
              </Button>
            </Group>
          </form>
        </FormProvider>
      </Modal>
    </>
  );
};

export default EventFormModal;
