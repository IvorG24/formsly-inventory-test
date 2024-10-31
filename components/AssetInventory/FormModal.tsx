import { getFormOnLoad } from "@/backend/api/get";
import { Database } from "@/utils/database";
import { InventoryFormResponseType, InventoryFormType } from "@/utils/types";
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

type Props = {
  formId: string;
  userId: string;
  isOpen: boolean;
  setSelectedEventId?: Dispatch<SetStateAction<string | null>>;
  onSubmit: (data: InventoryFormValues) => void;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedRow: any;
  mode: "create" | "edit";
};

const FormModal = ({
  formId,
  userId,
  onClose,
  isOpen,
  onSubmit,
  selectedRow,
  mode,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const requestFormMethods = useForm<InventoryFormValues>();

  const [formData, setFormData] = useState<InventoryFormType>();
  const { handleSubmit, control, formState, reset, getValues, setValue } =
    requestFormMethods;
  const [loading, setLoading] = useState(false); // Loading state
  const { fields: formSections, replace: replaceSection } = useFieldArray({
    control,
    name: "sections",
  });

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      return;
    }
    const getInventoryForm = async () => {
      try {
        setLoading(true);
        if (!userId || !formId) return;

        const params = { formId, userId };

        const { form } = await getFormOnLoad(supabaseClient, params);
        replaceSection(form.form_section);
        if (mode === "edit" && selectedRow) {
          const sections = getValues("sections");
          Object.keys(selectedRow).forEach((key) => {
            const normalizedKey = key
              .replace(/_/g, " ")
              .replace("inventory", "")
              .replace("warranty", "")
              .replace(/\bmaintenance\b(?! by| date completed)/gi, "")
              .toLowerCase()
              .trim();

            sections.forEach((section, sectionIndex) => {
              const fieldIndex = section.section_field.findIndex(
                (field) => field.field_name.toLowerCase() === normalizedKey
              );

              if (fieldIndex !== -1) {
                setValue(
                  `sections.${sectionIndex}.section_field.${fieldIndex}.field_response`,
                  selectedRow[key] instanceof Date
                    ? selectedRow[key]
                    : typeof selectedRow[key] === "number"
                      ? selectedRow[key]
                      : String(selectedRow[key]).trim()
                );
              }
            });
          });
        } else if (mode === "create") {
          replaceSection(form.form_section);
          reset({
            sections: form.form_section.map((section) => ({
              ...section,
              section_field: section.section_field.map((field) => ({
                ...field,
                field_response: "", // Set default value for each field response
              })),
            })),
          });
        }

        setFormData(form);
        setLoading(false);
      } catch (e) {
        notifications.show({
          message: "Something went wrong",
          color: "red",
        });
        setLoading(false);
      }
    };

    getInventoryForm();
  }, [userId, formId, selectedRow, mode, isOpen, getValues]);

  useEffect(() => {
    if (formState.isSubmitted) {
      if (mode === "create") {
        reset();
      }

      onClose();
    }
  }, [formState.isSubmitted, reset, mode]);
  return (
    <>
      <LoadingOverlay visible={formState.isSubmitting || loading} />
      <Modal withinPortal opened={isOpen} onClose={onClose} size="xl" centered>
        {loading ? null : ( // Show form only when loading is complete
          <>
            <Title order={3}>{formData?.form_name} Form</Title>
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
          </>
        )}
      </Modal>
    </>
  );
};

export default FormModal;
