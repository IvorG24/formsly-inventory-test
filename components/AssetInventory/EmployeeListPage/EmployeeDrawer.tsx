import { getFormOnLoad, getLocationOption } from "@/backend/api/get";
import { checkHRISNumber, createInventoryEmployee } from "@/backend/api/post";
import { useUserProfile } from "@/stores/useUserStore";
import { InventoryEmployeeList, InventoryFormType } from "@/utils/types";
import { Box, Button, Drawer, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import InventoryFormSection from "../CreateAssetPage/InventoryFormSection";
import { InventoryFormValues } from "../EventFormModal";
type Props = {
  isOpen: boolean;
  close: () => void;
  handleFetch: (page: number) => void;
  activePage: number;
  mode: "create" | "edit";
  employeeData?: InventoryEmployeeList;
};

const EmployeeDrawer = ({
  isOpen,
  close,
  handleFetch,
  activePage,
  mode,
  employeeData,
}: Props) => {
  const [formData, setFormData] = useState<InventoryFormType>();
  const userProfile = useUserProfile();
  const supabaseClient = useSupabaseClient();
  const requestFormMethods = useForm<InventoryFormValues>();
  const { handleSubmit, control, getValues, setValue, setError } =
    requestFormMethods;
  const {
    fields: formSections,
    replace: replaceSection,
    update: updateSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  const handleOnSiteNameChange = async (
    index: number,
    value: string | null
  ) => {
    try {
      const siteLocationSection = getValues(`sections.${index}`);

      if (value === null) {
        setValue(`sections.${index}.section_field.${5}.field_response`, "");
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

  useEffect(() => {
    const getInventoryForm = async () => {
      try {
        if (!userProfile || !isOpen) return;
        const { form } = await getFormOnLoad(supabaseClient, {
          userId: userProfile?.user_id,
          formId: "93b73759-26b0-46ee-9003-d332391f07f2",
        });
        setFormData(form);

        replaceSection(form.form_section);
        if (mode === "edit" && employeeData) {
          const sections = getValues("sections");

          Object.keys(employeeData).forEach((key) => {
            const normalizedKey = key
              .replace(/^scic_employee_/, "")
              .replace(/_/g, " ")
              .toLowerCase();

            sections.forEach((section, sectionIndex) => {
              const fieldIndex = section.section_field.findIndex(
                (field) => field.field_name.toLowerCase() === normalizedKey
              );

              if (fieldIndex !== -1) {
                const field = sections[0].section_field[fieldIndex];
                if (field.field_name.toLowerCase() === "hris id number") {
                  setValue(
                    `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`,
                    parseInt(employeeData[key], 10)
                  );
                } else if (field.field_name.toLowerCase() === "site") {
                  const siteValue = String(employeeData[key]);
                  setValue(
                    `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`,
                    siteValue
                  );

                  handleOnSiteNameChange(sectionIndex, siteValue);
                } else {
                  setValue(
                    `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`,
                    String(employeeData[key])
                  );
                }
              }
            });
          });
          replaceSection(sections);
        } else if (mode === "create") {
          replaceSection(form.form_section);
        }
      } catch (e) {
        notifications.show({
          message: "Something went wrong",
          color: "red",
        });
      }
    };
    getInventoryForm();
  }, [userProfile, isOpen, employeeData, mode, getValues, setValue]);

  const handleFormSubmit = async (data: InventoryFormValues) => {
    try {
      const hrisNumber = data.sections[0].section_field[0].field_response;
      const isEditMode = mode === "edit";
      const isCreateMode = mode === "create";

      const originalHRISNumber = isEditMode
        ? employeeData?.scic_employee_hris_id_number
        : null;

      if (
        isCreateMode ||
        (isEditMode && String(hrisNumber) !== String(originalHRISNumber))
      ) {
        const isHRISUnique = await checkHRISNumber(supabaseClient, {
          hrisNumber: String(hrisNumber),
        });

        if (isHRISUnique) {
          setError(`sections.${0}.section_field.${0}.field_response`, {
            type: "manual",
            message: "HRIS number must be unique.",
          });
          return;
        }
      }

      await createInventoryEmployee(supabaseClient, {
        EmployeeData: data,
      });

      notifications.show({
        message: isCreateMode
          ? "Employee created successfully"
          : "Employee updated successfully",
        color: "green",
      });

      // Refresh data and close the form
      handleFetch(activePage);
      close();
      replaceSection(formData?.form_section || []);
    } catch (e) {
      notifications.show({
        message: "An error occurred. Please try again.",
        color: "red",
      });
    }
  };

  return (
    <Drawer
      title={formData?.form_description}
      position="right"
      opened={isOpen}
      onClose={() => {
        close();
        replaceSection(formData?.form_section || []);
      }}
    >
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
    </Drawer>
  );
};

export default EmployeeDrawer;
