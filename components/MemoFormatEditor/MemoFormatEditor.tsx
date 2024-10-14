import { getMemoFormat } from "@/backend/api/get";
import { uploadImage } from "@/backend/api/post";
import { updateMemoFormat } from "@/backend/api/update";
import { MAX_FILE_SIZE } from "@/utils/constant";
import { startCase } from "@/utils/string";
import {
  MemoFormatAttachmentTableInsert,
  MemoFormatAttachmentTableRow,
  MemoFormatSubsectionTableUpdate,
  MemoFormatTableUpdate,
} from "@/utils/types";
import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Container,
  Divider,
  FileInput,
  Flex,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { IconPhotoUp, IconTrashFilled } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import {
  Controller,
  FieldErrors,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import MemoFormatMarkdownInput from "./MemoFormatMarkdownInput";
import MemoFormatPreview from "./MemoFormatPreview";

type Props = {
  opened: boolean;
  close: () => void;
};

export type MemoFormatFormValues = {
  formatSection: (MemoFormatTableUpdate & {
    format_subsection: (MemoFormatSubsectionTableUpdate & {
      subsection_attachment: ((
        | MemoFormatAttachmentTableRow
        | MemoFormatAttachmentTableInsert
      ) & {
        memo_format_attachment_file: File | null;
      })[];
    })[];
  })[];
};

type MemoFormatFormImageField =
  MemoFormatFormValues["formatSection"][0]["format_subsection"][0]["subsection_attachment"][0];

const marginPositionList = ["top", "right", "bottom", "left"];
const sectionColorList = ["blue", "green", "gray"];

const MemoFormatEditor = ({ opened, close }: Props) => {
  const supabaseClient = createPagesBrowserClient();
  const user = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] =
    useState<FieldErrors<MemoFormatFormValues>>();

  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<MemoFormatFormValues>();

  const formatValues = useWatch<MemoFormatFormValues>({ control });

  const { fields: formatSection, replace: replaceFormatSection } =
    useFieldArray({
      control,
      name: "formatSection",
    });

  const handleSaveFormat = async (data: MemoFormatFormValues) => {
    if (!user) return;
    try {
      setIsLoading(true);
      // upload image attachments
      const memoFormatSectionData = await Promise.all(
        data.formatSection.map(async (section) => {
          const updatedSubsectionData = await Promise.all(
            section.format_subsection.map(async (subsection) => {
              if (subsection.subsection_attachment.length > 0) {
                const updatedAttachmentData = await Promise.all(
                  subsection.subsection_attachment.map(
                    async (attachment, attachmentIndex) => {
                      if (attachment.memo_format_attachment_file) {
                        const bucket = "MEMO_ATTACHMENTS";
                        const attachmentPublicUrl = (
                          await uploadImage(supabaseClient, {
                            image: attachment.memo_format_attachment_file,
                            bucket,
                            fileType: "m",
                            userId: user.id,
                          })
                        ).publicUrl;

                        return {
                          ...attachment,
                          memo_format_attachment_url: attachmentPublicUrl,
                          memo_format_attachment_name:
                            attachment.memo_format_attachment_file.name,
                          memo_format_attachment_order: `${attachmentIndex}`,
                          memo_format_attachment_subsection_id:
                            subsection.memo_format_subsection_id,
                        };
                      }

                      return {
                        ...attachment,
                        memo_format_attachment_order: `${attachmentIndex}`,
                        memo_format_attachment_subsection_id:
                          subsection.memo_format_subsection_id,
                      };
                    }
                  )
                );

                return {
                  ...subsection,
                  subsection_attachment: updatedAttachmentData,
                };
              }
              return subsection;
            })
          );

          return {
            ...section,
            format_subsection: updatedSubsectionData,
          };
        })
      );

      const updatedFormatData = await updateMemoFormat(
        supabaseClient,
        memoFormatSectionData as MemoFormatFormValues["formatSection"]
      );

      replaceFormatSection(updatedFormatData);

      notifications.show({
        message: "Memo format updated.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Failed to save format",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddImageField = (
    sectionIndex: number,
    subsectionIndex: number
  ) => {
    const memo_format_attachment_id = uuidv4();
    const newImageField: MemoFormatFormImageField = {
      memo_format_attachment_id,
      memo_format_attachment_name: "",
      memo_format_attachment_order: "",
      memo_format_attachment_url: "",
      memo_format_attachment_file: null,
    };

    const currentSubsectionData =
      formatSection[sectionIndex].format_subsection[subsectionIndex];

    const currentSubsectionAttachmentList =
      currentSubsectionData.subsection_attachment;

    const updatedSubsectionAttachmentList = [
      ...currentSubsectionAttachmentList,
      newImageField,
    ];

    setValue(
      `formatSection.${sectionIndex}.format_subsection.${subsectionIndex}.subsection_attachment`,
      updatedSubsectionAttachmentList
    );
  };

  const handleRemoveImageField = (
    sectionIndex: number,
    subsectionIndex: number,
    memoAttachmentId: string
  ) => {
    const currentSubsectionData =
      formatSection[sectionIndex].format_subsection[subsectionIndex];

    const currentSubsectionAttachmentList =
      currentSubsectionData.subsection_attachment;

    const updatedSubsectionAttachmentList =
      currentSubsectionAttachmentList.filter(
        (attachment) =>
          attachment.memo_format_attachment_id !== memoAttachmentId
      );
    setValue(
      `formatSection.${sectionIndex}.format_subsection.${subsectionIndex}.subsection_attachment`,
      updatedSubsectionAttachmentList
    );
  };

  const marginFieldHasError = (sectionIndex: number, fieldName: string) => {
    if (!formErrors) return;

    switch (fieldName) {
      case "memo_format_section_margin_top":
        return formErrors.formatSection?.[sectionIndex]
          ?.memo_format_section_margin_top?.message;

      case "memo_format_section_margin_right":
        return formErrors.formatSection?.[sectionIndex]
          ?.memo_format_section_margin_right?.message;
      case "memo_format_section_margin_bottom":
        return formErrors.formatSection?.[sectionIndex]
          ?.memo_format_section_margin_bottom?.message;
      case "memo_format_section_margin_left":
        return formErrors.formatSection?.[sectionIndex]
          ?.memo_format_section_margin_left?.message;

      default:
        break;
    }
  };

  useEffect(() => {
    const fetchMemoFormat = async () => {
      const defaultMemoFormat = await getMemoFormat(supabaseClient);
      setValue("formatSection", defaultMemoFormat);
    };
    fetchMemoFormat();
    setFormErrors(errors);
  }, [setValue, supabaseClient, errors]);

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={"Memo Format Editor"}
      fullScreen
      transitionProps={{ transition: "fade", duration: 200 }}
      styles={{
        header: {
          backgroundColor: "#339AF0",
        },
        close: {
          color: "#ffffff",
        },
        title: {
          color: "#ffffff",
          fontWeight: 600,
          fontSize: 24,
        },
      }}
    >
      <Container p="lg" h="100" fluid>
        <LoadingOverlay overlayBlur={2} visible={isLoading} />
        <Flex
          justify="center"
          w="100%"
          wrap="wrap"
          gap={{ base: "md", lg: 48 }}
        >
          <form onSubmit={handleSubmit(handleSaveFormat)}>
            <Stack spacing="lg" maw={600}>
              {formatSection.map((section, sectionIndex) => {
                return (
                  <Box key={section.id}>
                    <Stack spacing="xs" key={section.id}>
                      <Title order={4} color={sectionColorList[sectionIndex]}>
                        {startCase(`${section.memo_format_section_name}`)}
                      </Title>
                      <Flex p="xs" wrap="wrap" gap="md">
                        {marginPositionList.map(
                          (marginPosition, marginPositionIndex) => {
                            const fieldName = `formatSection.${sectionIndex}.memo_format_section_margin_${marginPosition}`;

                            return (
                              <Controller
                                key={marginPosition + "-" + marginPositionIndex}
                                control={control}
                                name={fieldName as keyof MemoFormatFormValues}
                                rules={{
                                  required: "This field is required",
                                  min: {
                                    value: 0,
                                    message: "Margin has a minimum of 0",
                                  },
                                  max: {
                                    value: 400,
                                    message: "Margin has a maximum of 400",
                                  },
                                }}
                                render={({ field: { onChange, value } }) => (
                                  <NumberInput
                                    w={120}
                                    label={`${startCase(
                                      marginPosition
                                    )} Margin`}
                                    onChange={onChange}
                                    value={Number(value)}
                                    error={marginFieldHasError(
                                      sectionIndex,
                                      `memo_format_section_margin_${marginPosition}`
                                    )}
                                  />
                                )}
                              />
                            );
                          }
                        )}
                      </Flex>
                      <Accordion variant="separated">
                        {section.format_subsection.map(
                          (subsection, subsectionIndex) => {
                            return (
                              <Accordion.Item
                                value={`${subsection.memo_format_subsection_name}`}
                                key={subsection + "-" + subsectionIndex}
                              >
                                <Accordion.Control
                                  style={{
                                    border: `2px solid ${
                                      errors?.formatSection?.[sectionIndex]
                                        ?.format_subsection?.[subsectionIndex]
                                        ? "red"
                                        : "white"
                                    }`,
                                  }}
                                >{`${startCase(
                                  `${subsection.memo_format_subsection_name}`
                                )} Section`}</Accordion.Control>
                                <Accordion.Panel>
                                  <Stack spacing={12}>
                                    <Flex gap="sm" wrap="wrap">
                                      <Controller
                                        control={control}
                                        name={`formatSection.${sectionIndex}.format_subsection.${subsectionIndex}.memo_format_subsection_text`}
                                        render={({
                                          field: { onChange, value },
                                        }) => (
                                          <Box sx={{ flex: 1 }}>
                                            <Text
                                              size={14}
                                              weight={600}
                                            >{`Add text (optional)`}</Text>
                                            <MemoFormatMarkdownInput
                                              value={value}
                                              onChange={onChange}
                                            />
                                          </Box>
                                        )}
                                      />
                                      <Controller
                                        control={control}
                                        name={`formatSection.${sectionIndex}.format_subsection.${subsectionIndex}.memo_format_subsection_text_font_size`}
                                        render={({
                                          field: { onChange, value },
                                        }) => (
                                          <NumberInput
                                            w={120}
                                            min={8}
                                            max={64}
                                            label={`Font Size`}
                                            onChange={onChange}
                                            value={Number(value)}
                                            error={
                                              errors?.formatSection?.[
                                                sectionIndex
                                              ]?.format_subsection?.[
                                                subsectionIndex
                                              ]
                                                ?.memo_format_subsection_text_font_size
                                                ?.message
                                            }
                                          />
                                        )}
                                        rules={{
                                          min: {
                                            value: 8,
                                            message:
                                              "Font size has a minimum of 8",
                                          },
                                          max: {
                                            value: 64,
                                            message:
                                              "Font size has a maximum of 64",
                                          },
                                          validate: (v) =>
                                            v !== "" ||
                                            "Font size has a minimum of 8",
                                        }}
                                      />
                                    </Flex>
                                    {subsection.subsection_attachment.map(
                                      (attachment, attachmentIndex) => (
                                        <Stack
                                          key={
                                            attachment.memo_format_attachment_id
                                          }
                                          spacing={4}
                                        >
                                          <Group w="100%" position="apart">
                                            <Text size={14} weight={600}>
                                              Attach image (optional)
                                            </Text>
                                            <ActionIcon
                                              color="red"
                                              onClick={() =>
                                                handleRemoveImageField(
                                                  sectionIndex,
                                                  subsectionIndex,
                                                  `${attachment.memo_format_attachment_id}`
                                                )
                                              }
                                            >
                                              <IconTrashFilled size={16} />
                                            </ActionIcon>
                                          </Group>
                                          <Controller
                                            control={control}
                                            name={`formatSection.${sectionIndex}.format_subsection.${subsectionIndex}.subsection_attachment.${attachmentIndex}.memo_format_attachment_file`}
                                            render={({
                                              field: { onChange, value },
                                            }) => (
                                              <FileInput
                                                icon={<IconPhotoUp size={16} />}
                                                placeholder="For best results, upload an image with an aspect ratio of 3:1 (90x30 pixels)"
                                                accept="image/*"
                                                value={value}
                                                onChange={onChange}
                                                clearable
                                              />
                                            )}
                                            rules={{
                                              validate: (v) => {
                                                if (!v) {
                                                  return true;
                                                }
                                                return (
                                                  v.size < MAX_FILE_SIZE ||
                                                  "Image exceeds 5mb. Please use an image below 5mb."
                                                );
                                              },
                                            }}
                                          />
                                        </Stack>
                                      )
                                    )}
                                    <Button
                                      onClick={() =>
                                        handleAddImageField(
                                          sectionIndex,
                                          subsectionIndex
                                        )
                                      }
                                    >
                                      Add Image
                                    </Button>
                                  </Stack>
                                </Accordion.Panel>
                              </Accordion.Item>
                            );
                          }
                        )}
                      </Accordion>
                    </Stack>
                    {sectionIndex !== formatSection.length - 1 && (
                      <Divider mt="md" size={2} color="dark" />
                    )}
                  </Box>
                );
              })}

              <Flex w="100%" mt="xl" wrap="wrap" gap="xl">
                <Button
                  sx={{ flex: 1 }}
                  onClick={close}
                  w={120}
                  size="md"
                  variant="outline"
                >
                  Close
                </Button>
                <Button sx={{ flex: 1 }} type="submit" w={120} size="md">
                  Save
                </Button>
              </Flex>
            </Stack>
          </form>
          <Box maw={600} mah={900} sx={{ flex: 1 }}>
            <Title order={4} mb="sm">
              Preview
            </Title>
            <MemoFormatPreview
              formatData={formatValues as MemoFormatFormValues}
            />
          </Box>
        </Flex>
      </Container>
    </Modal>
  );
};

export default MemoFormatEditor;
