import {
  getCustomerList,
  getInventoryFormDetails,
  getLocationOption,
} from "@/backend/api/get";
import { updateEvent } from "@/backend/api/update";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile, useUserTeamMember } from "@/stores/useUserStore";
import { Database } from "@/utils/database";
import {
  FormType,
  InventoryEmployeeList,
  InventoryFormResponseType,
  InventoryFormType,
  RequestResponseTableRow,
} from "@/utils/types";
import {
  Box,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
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
  setSelectedEventId?: Dispatch<SetStateAction<string | null>>;
  teamMemberList: InventoryEmployeeList[];
  handleFilterForms: () => void;
};

const EventFormModal = ({
  eventId,
  userId,
  selectedRow,
  teamMemberList,
  handleFilterForms,
  setSelectedEventId,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const activeTeam = useActiveTeam();
  const teamMember = useUserTeamMember();
  const userData = useUserProfile();
  const requestFormMethods = useForm<InventoryFormValues>();
  const [isLoading, setIsloading] = useState(false);
  const [opened, setOpened] = useState(true);
  const [formData, setFormData] = useState<InventoryFormType>();
  const { handleSubmit, control, getValues, setValue } = requestFormMethods;
  const {
    fields: formSections,
    replace: replaceSection,
    update: updateSection,
    remove: removeSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  const handleFormSubmit = async (data: InventoryFormValues) => {
    try {
      setIsloading(true);
      //   const formValidation = securityGroup.asset.filter.event.includes(
      //     `${formData?.form_name}`
      //   );

      //   if (!formValidation) {
      //     notifications.show({
      //       message: "Action not allowed",
      //       color: "red",
      //     });
      //     return;
      //   }

      await updateEvent(supabaseClient, {
        updateResponse: data,
        selectedRow,
        eventId,
        teamMemberId: teamMember?.team_member_id,
        type: formData?.form_name ?? "",
        userId: userData?.user_id,
      });
      setOpened(false);
      handleFilterForms();
      notifications.show({
        message: "Event Submitted",
        color: "green",
      });
      setIsloading(false);
    } catch (e) {
      setIsloading(false);

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

        if (
          form.form_section[0].section_field[0].field_name ===
            "Check In From" ||
          form.form_section[0].section_field[0].field_name === "Check Out To" ||
          form.form_section[0].section_field[0].field_name === "Appointed To"
        ) {
          const oldSection = [
            {
              ...form.form_section[0],
              section_field: [form.form_section[0].section_field[0]],
            },
          ];
          replaceSection(oldSection);
        } else {
          replaceSection(form.form_section);
        }

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
      const { data: customerOption } = await getCustomerList(supabaseClient, {
        teamId: activeTeam.team_id,
      });

      const teamMemberOption = teamMemberList.map((member, idx) => ({
        option_id: member.scic_employee_id,
        option_value: `${member.scic_employee_first_name} ${member.scic_employee_last_name}`,
        option_order: idx,
        option_field_id: form.form_section[0].section_field[0].field_id,
      }));
      const customerListOption = customerOption.map((customer, idx) => ({
        option_id: customer.customer_id,
        option_value: `${customer.customer_name}`,
        option_order: idx,
        option_field_id: form.form_section[0].section_field[0].field_id,
      }));

      if (value === null) {
        const oldSection = [
          {
            ...form.form_section[0],
            section_field: [categorySection.section_field[0]],
          },
        ];
        replaceSection(oldSection);
        return;
      }

      removeSection(0);

      let newSectionField = [...form.form_section[0].section_field];

      if (value === "Customer") {
        newSectionField = newSectionField.filter(
          (field) =>
            field.field_name !== "Site" &&
            field.field_name !== "Department" &&
            field.field_name !== "Location" &&
            field.field_name !== "Assigned To"
        );
      } else if (
        value === "Person" &&
        form.form_name !== "Check Out" &&
        form.form_name !== "Check In"
      ) {
        newSectionField = newSectionField.filter(
          (field) =>
            field.field_name !== "Site" &&
            field.field_name !== "Location" &&
            field.field_name !== "Department" &&
            field.field_name !== "Customer"
        );
      } else if (value === "Site") {
        newSectionField = newSectionField.filter(
          (field) =>
            field.field_name !== "Assigned To" &&
            field.field_name !== "Customer"
        );
      }
      newSectionField = newSectionField.map((field) => {
        if (field.field_name === "Assigned To") {
          return {
            ...field,
            field_option: teamMemberOption,
          };
        } else if (field.field_name === "Customer") {
          return {
            ...field,
            field_option: customerListOption,
          };
        }
        return field;
      });

      // Update the form section with the new fields
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

      if (value === null) {
        setValue(`sections.${index}.section_field.${3}.field_response`, "");
        setValue(`sections.${index}.section_field.${4}.field_option`, []);
        updateSection(index, {
          ...siteLocationSection,
          section_field: siteLocationSection.section_field,
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
        option_field_id: siteLocationSection.section_field[0].field_id,
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
      <LoadingOverlay visible={isLoading} />
      <Modal
        withinPortal
        opened={formisEmpty ? opened : false}
        onClose={() => {
          setOpened(false);
          if (setSelectedEventId) {
            setSelectedEventId(null);
          }
        }}
        size="xl"
      >
        <Title order={3}>{formData?.form_name} Form Event</Title>
        <FormProvider {...requestFormMethods}>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
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
