// todo: Create deleteField query
// import deleteField from "@/services/field/deleteField";

import { getSpecialFieldTemplate } from "@/backend/api/get";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { useActiveTeam } from "@/stores/useTeamStore";
import { Database } from "@/utils/database";
import {
  FieldWithFieldArrayId,
  SectionWithFieldArrayId,
} from "@/utils/react-hook-form";
import {
  AppType,
  FieldWithChoices,
  SpecialFieldTemplateTableRow,
} from "@/utils/types";
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Container,
  ContainerProps,
  Divider,
  Flex,
  Modal,
  Select,
  Stack,
  TextInput,
  createStyles,
  useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconCirclePlus, IconSettings } from "@tabler/icons-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import useDeepCompareEffect from "use-deep-compare-effect";
import { v4 as uuidv4 } from "uuid";
import Field from "./Field";

export type Mode = "answer" | "edit" | "view";

type Props = {
  formType: AppType;
  section: SectionWithFieldArrayId;
  sectionIndex: number;
  onDelete?: (sectionId: string) => void;
  fields: FieldWithChoices[];
  mode?: Mode;
  activeField: string | null;
  onSetActiveField: Dispatch<SetStateAction<string | null>>;
} & ContainerProps;

type UseStylesProps = {
  mode: Mode;
};

const useStyles = createStyles((theme, { mode }: UseStylesProps) => ({
  container: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? mode === "edit"
          ? theme.colors.dark[7]
          : theme.colors.dark[7]
        : "#fff",
    borderRadius: 4,
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[2]
    }
    `,
    paddingInline: "32px",
    paddingTop: "16px",
    paddingBottom: mode === "edit" ? "16px" : "32px",
  },
  sectionName: {
    "& input": {
      fontSize: 18,
      fontWeight: 500,
    },
  },
}));

const Section = ({
  formType,
  section,
  sectionIndex,
  onDelete,
  mode = "edit",
  activeField,
  onSetActiveField,
  ...props
}: Props) => {
  const { classes } = useStyles({ mode });
  const { setIsLoading } = useLoadingActions();
  const team = useActiveTeam();
  const supabaseClient = createPagesBrowserClient<Database>();
  const methods = useFormContext();
  const { colorScheme } = useMantineTheme();

  const [specialFieldTemplateList, setSpecialFieldTemplateList] = useState<
    SpecialFieldTemplateTableRow[]
  >([]);
  const [selectedSpecialFieldTemplateId, setSelectedSpecialFieldTemplateId] =
    useState<string | null>(null);
  const [
    isOpenSpecialFieldSelect,
    { open: openSpecialFieldSelect, close: closeSpecialFieldSelect },
  ] = useDisclosure(false);
  const [currencyOptionList, setCurrencyOptionList] = useState<
    { value: string; label: string }[]
  >([]);

  const {
    fields: fields,
    append: appendField,
    remove: removeField,
  } = useFieldArray({
    control: methods.control,
    name: `sections.${sectionIndex}.fields`,
  });

  const watchedData = useWatch({
    control: methods.control,
    defaultValue: section,
  });

  const handleSelectSpecialField = (specialFieldId: string | null) => {
    if (!specialFieldId) return;
    const fieldId = uuidv4();
    const specialFieldTemplate = specialFieldTemplateList.find(
      (field) => field.special_field_template_id === specialFieldId
    );

    if (!specialFieldTemplate) return;

    const specialField = {
      field_id: fieldId,
      field_name: specialFieldTemplate.special_field_template_name,
      field_type: specialFieldTemplate.special_field_template_type,
      field_section_id: section.section_id,
      field_is_required: false,
      field_is_positive_metric: true,
      field_order: fields.length + 1,
      field_special_field_template_id: specialFieldId,
    };

    appendField(specialField);
    onSetActiveField(fieldId);
    setSelectedSpecialFieldTemplateId(null);
    closeSpecialFieldSelect();
  };

  // this is to update the field order when a field is removed
  useDeepCompareEffect(() => {
    fields.forEach((field, index) => {
      methods.setValue(
        `sections.${sectionIndex}.fields.${index}.field_order`,
        index + 1
      );
    });
  }, [watchedData]);

  useEffect(() => {
    const fetchSpecialFieldList = async () => {
      setIsLoading(true);
      try {
        const data = await getSpecialFieldTemplate(supabaseClient);
        setSpecialFieldTemplateList(data ?? []);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSpecialFieldList();
  }, [team]);

  // fetch currency option list
  useEffect(() => {
    const fetchCurrencyOptionList = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabaseClient
          .schema("lookup_schema")
          .from("currency_table")
          .select("*");
        if (!data) return;
        const optionList = data.map((item) => ({
          value: item.currency_alphabetic_code,
          label: item.currency_alphabetic_code,
        }));
        setCurrencyOptionList(optionList);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCurrencyOptionList();
  }, []);

  return (
    <Container
      maw={768}
      className={classes.container}
      key={section.id}
      {...props}
    >
      <Box>
        {!(mode === "answer" && !section.section_name) && (
          <Box>
            <TextInput
              variant="unstyled"
              size="lg"
              className={classes.sectionName}
              {...methods.register(`sections.${sectionIndex}.section_name`)}
              aria-label={`sections.${sectionIndex}.name`}
              placeholder="Section Name"
              readOnly={mode !== "edit"}
            />
            {mode === "edit" && <Divider mt={-4} />}
          </Box>
        )}
        {fields.map((field, fieldIndex) => {
          const field_id = methods.getValues(
            `sections.${sectionIndex}.fields.${fieldIndex}.field_id`
          );
          const fieldWithType = field as FieldWithFieldArrayId;

          return (
            <Flex
              align="center"
              gap="xs"
              key={field.id}
              mt={fieldIndex === 0 ? 24 : 16}
              w="100%"
            >
              <Box w="100%">
                <Field
                  formType={formType}
                  fieldIndex={fieldIndex}
                  field={fieldWithType}
                  sectionIndex={sectionIndex}
                  onDelete={() => removeField(fieldIndex)}
                  mode={mode}
                  isActive={activeField === field_id}
                  onNotActive={() => onSetActiveField(null)}
                  isSpecialField={
                    fieldWithType.field_special_field_template_id !== null
                  }
                  currencyOptionList={currencyOptionList}
                />
              </Box>
              {activeField === null && (
                <ActionIcon
                  onClick={() => {
                    onSetActiveField(field_id);
                  }}
                  variant="light"
                  mt="lg"
                >
                  <IconSettings
                    color={colorScheme === "dark" ? "#c3c3c3" : "#2e2e2e"}
                    size={18}
                    stroke={1.5}
                  />
                </ActionIcon>
              )}
            </Flex>
          );
        })}
      </Box>

      {mode === "edit" && (
        <>
          <Flex gap="sm" w="100%">
            <Button
              onClick={() => {
                const fieldId = uuidv4();
                appendField({
                  field_id: fieldId,
                  field_name: "",
                  field_type: formType === "REQUEST" ? "TEXT" : "SLIDER",
                  field_section_id: section.section_id,
                  field_is_required: false,
                  field_is_positive_metric: true,
                  field_order: fields.length + 1,
                });
                onSetActiveField(fieldId);
              }}
              disabled={activeField !== null}
              size="sm"
              mt={fields.length > 0 ? 32 : 64}
              leftIcon={<IconCirclePlus height={16} />}
              fullWidth
            >
              Add new field
            </Button>
            {specialFieldTemplateList.length > 0 && (
              <Button
                onClick={openSpecialFieldSelect}
                disabled={activeField !== null}
                size="sm"
                mt={fields.length > 0 ? 32 : 64}
                leftIcon={<IconCirclePlus height={16} />}
                fullWidth
                variant="outline"
              >
                Add specialized field
              </Button>
            )}
          </Flex>

          <Divider mt={24} />

          <Flex justify="space-between">
            <Checkbox
              label="Duplicatable section"
              {...methods.register(
                `sections.${sectionIndex}.section_is_duplicatable`
              )}
              mt="md"
              sx={{
                input: {
                  cursor: "pointer",
                },
              }}
            />

            <Button
              size="xs"
              color="red"
              variant="subtle"
              mt={16}
              onClick={() => {
                onDelete && onDelete(section.section_id);
              }}
            >
              Remove Section
            </Button>
          </Flex>
        </>
      )}

      {specialFieldTemplateList.length > 0 && (
        <Modal
          opened={isOpenSpecialFieldSelect}
          onClose={closeSpecialFieldSelect}
          title="Special Field List"
          centered
        >
          <Stack>
            <Select
              label="Select a special field"
              data={specialFieldTemplateList.map((field) => ({
                value: field.special_field_template_id,
                label: field.special_field_template_name,
              }))}
              placeholder="Special Field"
              value={selectedSpecialFieldTemplateId}
              onChange={setSelectedSpecialFieldTemplateId}
              withinPortal={true}
            />
            <Button
              onClick={() =>
                handleSelectSpecialField(selectedSpecialFieldTemplateId)
              }
              disabled={!selectedSpecialFieldTemplateId}
            >
              Submit
            </Button>
          </Stack>
        </Modal>
      )}
    </Container>
  );
};

export default Section;
