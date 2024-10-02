import { getInventoryFormDetails } from "@/backend/api/get";
import { Database } from "@/utils/database";
import {
  FormType,
  InventoryFormResponseType,
  InventoryFormType,
  RequestResponseTableRow,
} from "@/utils/types";
import { Box, Button, Group, Modal } from "@mantine/core";
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
  selectedRow:string[]
};

const EventFormModal = ({ eventId, userId,selectedRow }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const requestFormMethods = useForm<InventoryFormValues>();
  const [opened, setOpened] = useState(true);

  const [formData, setFormData] = useState<InventoryFormType>();
  const { handleSubmit, control } = requestFormMethods;
  const { fields: formSections, replace: replaceSection } = useFieldArray({
    control,
    name: "sections",
  });

  const onSubmit = (data: InventoryFormValues) => {
    console.log(data);
    setOpened(false);
  };

  useEffect(() => {
    const getInventoryForm = async () => {
      try {
        if (!userId || !eventId) return;

        const params = { eventId, userId };
        const form = await getInventoryFormDetails(supabaseClient, params);

        if (form) {
          setFormData(form);
          replaceSection(form.form_section);
        }
      } catch (e) {}
    };

    getInventoryForm();
  }, [userId, eventId, replaceSection, opened]);
  const formisEmpty = formData && formData.form_section.length > 0;
  return (
    <>
      <Modal
        opened={formisEmpty ? opened : false}
        onClose={() => setOpened(false)}
        size="xl"
        title={`Form for Event: ${formData?.form_name}`}
      >
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
      </Modal>
    </>
  );
};

export default EventFormModal;
