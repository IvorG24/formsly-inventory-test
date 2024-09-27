import { getFormSection } from "@/backend/api/get";
import { Database } from "@/utils/database";
import { FormType } from "@/utils/types";
import { LoadingOverlay, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import FormSection from "./FormSection";

type Props = {
  formId: string;
  formName: string;
};

const FormSectionList = ({ formId, formName }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();

  const [sectionList, setSectionList] = useState<FormType["form_section"]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchSectionList = async () => {
      try {
        setIsFetching(true);
        const data = await getFormSection(supabaseClient, {
          formId: formId,
          formName: formName,
        });

        setSectionList(data);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsFetching(false);
      }
    };
    fetchSectionList();
  }, [formId, formName]);

  return (
    <Stack spacing="xl">
      <LoadingOverlay visible={isFetching} overlayBlur={2} />
      {sectionList.map((section) => (
        <FormSection section={section} key={section.section_id} />
      ))}
    </Stack>
  );
};

export default FormSectionList;
