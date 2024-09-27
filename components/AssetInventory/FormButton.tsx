import { getInventoryFormDetails } from "@/backend/api/get";
import { Database } from "@/utils/database";
import {
  FormType,
  InventoryFormResponseType,
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
};

const FormEventModal = ({ eventId, userId }: Props) => {
  const [opened, setOpened] = useState(false);
  const supabaseClient = createPagesBrowserClient<Database>();
  const requestFormMethods = useForm<InventoryFormValues>();
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

        const params = {
          eventId,
          userId,
        };
        const form = await getInventoryFormDetails(supabaseClient, params);
        console.log(form);

        replaceSection(form.form_section);
      } catch (e) {
        console.log(e);
      }
    };
    getInventoryForm();
  }, [userId, eventId]);

  return (
    <>
      <Modal
        opened={true}
        onClose={() => setOpened(false)}
        title={`Form for Event: ${eventId}`}
      >
        <FormProvider {...requestFormMethods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {formSections.map((section, idx) => {
              return (
                <Box key={section.id}>
                  <InventoryFormSection
                    type="Modal"
                    key={section.section_id}
                    section={section}
                    sectionIndex={idx}
                  />
                </Box>
              );
            })}

            <Group position="right" mt="md">
              <Button type="submit">Submit</Button>
            </Group>
          </form>
        </FormProvider>
      </Modal>
    </>
  );
};

export default FormEventModal;
