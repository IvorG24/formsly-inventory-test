import { getFormOnLoad, getLocationOption } from "@/backend/api/get";
import { checkCustomerName, createInventoryCustomer } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile } from "@/stores/useUserStore";
import { InventoryCustomerList, InventoryFormType } from "@/utils/types";
import { Box, Button, Drawer, Group, LoadingOverlay } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import InventoryFormSection from "../CreateAssetPage/InventoryFormSection";
import { InventoryFormValues } from "../EventFormModal";
type Props = {
  mode: "create" | "edit";
  isOpen: boolean;
  close: () => void;
  handleFetch: (page: number) => void;
  activePage: number;
  customerData?: InventoryCustomerList;
  setCustomerData: React.Dispatch<
    React.SetStateAction<InventoryCustomerList | null>
  >;
};

const CustomerDrawer = ({
  isOpen,
  close,
  handleFetch,
  activePage,
  mode,
  customerData,
  setCustomerData,
}: Props) => {
  const [formData, setFormData] = useState<InventoryFormType>();
  const userProfile = useUserProfile();
  const supabaseClient = useSupabaseClient();
  const activeTeam = useActiveTeam();
  const requestFormMethods = useForm<InventoryFormValues>();
  const [isLoading, setIsLoading] = useState(false);
  const { handleSubmit, control, getValues, setValue, setError, formState } =
    requestFormMethods;
  const {
    fields: formSections,
    replace: replaceSection,
    update: updateSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  useEffect(() => {
    const getInventoryForm = async () => {
      try {
        if (!userProfile || !isOpen) return;
        setIsLoading(true);
        const { form } = await getFormOnLoad(supabaseClient, {
          userId: userProfile?.user_id,
          formId: "b15e05e6-b8c9-4599-ab01-7e3afd0cdd68",
        });
        setFormData(form);

        replaceSection(form.form_section);
        if (mode === "edit" && customerData) {
          const sections = getValues("sections");

          Object.keys(customerData).forEach((key) => {
            const normalizedKey = key.replace(/_/g, " ").toLowerCase();

            sections.forEach((section, sectionIndex) => {
              const fieldIndex = section.section_field.findIndex(
                (field) => field.field_name.toLowerCase() === normalizedKey
              );

              if (fieldIndex !== -1) {
                setValue(
                  `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`,
                  String(customerData[key])
                );
              }
            });
          });

          replaceSection(sections);
        } else if (mode === "create") {
          replaceSection(form.form_section);
        }
        setIsLoading(false);
      } catch (e) {
        setIsLoading(false);
        notifications.show({
          message: "Something went wrong",
          color: "red",
        });
      }
    };

    getInventoryForm();
  }, [userProfile, isOpen, customerData, mode, getValues, setValue]);

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

  const handleFormSubmit = async (data: InventoryFormValues) => {
    try {
      const customerName = data.sections[0].section_field[0].field_response;
      const isEditMode = mode === "edit";
      const isCreateMode = mode === "create";

      const originalHRISNumber = isEditMode
        ? customerData?.customer_name
        : null;

      if (
        isCreateMode ||
        (isEditMode && String(customerName) !== String(originalHRISNumber))
      ) {
        const isCustomerUnique = await checkCustomerName(supabaseClient, {
          customerName: String(customerName),
        });

        if (isCustomerUnique) {
          setError(`sections.${0}.section_field.${0}.field_response`, {
            type: "manual",
            message: "Customer name must be unique.",
          });
          return;
        }
      }

      await createInventoryCustomer(supabaseClient, {
        customerData: data,
        customerExistingId: customerData?.customer_id,
        teamId: activeTeam.team_id,
      });

      notifications.show({
        message: "Employee created successfully",
        color: "green",
      });
      handleFetch(activePage);
      close();
      replaceSection(formData?.form_section || []);
    } catch (e) {
    } finally {
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
        setCustomerData(null);
      }}
    >
      <LoadingOverlay visible={isLoading || formState.isSubmitting} />
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

export default CustomerDrawer;
