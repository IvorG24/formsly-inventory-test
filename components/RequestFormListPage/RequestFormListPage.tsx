import { deleteForm } from "@/backend/api/delete";
import { getFormListWithFilter } from "@/backend/api/get";
import { updateFormVisibility } from "@/backend/api/update";
import { useFormActions, useFormList } from "@/stores/useFormStore";
import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { DEFAULT_FORM_LIST_LIMIT } from "@/utils/constant";
import { Database } from "@/utils/database";
import { startCase } from "@/utils/string";
import { FormWithOwnerType } from "@/utils/types";
import {
  ActionIcon,
  Container,
  Flex,
  LoadingOverlay,
  MultiSelect,
  Pagination,
  Select,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useFocusWithin } from "@mantine/hooks";
import { openConfirmModal } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import FormCard from "./FormCard";

type Props = {
  formList: FormWithOwnerType[];
  formListCount: number;
  teamId: string;
};

type SearchForm = {
  search: string;
  creatorList: string[];
  isAscendingSort: boolean;
  status?: "hidden" | "visible";
};

type FormFilterValues = {
  creatorFilter: string[];
};

const RequestFormListPage = ({
  formList: initialFormList,
  formListCount: initialFormListCount,
  teamId,
}: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const teamMemberList = useTeamMemberList();
  const forms = useFormList();

  const [formList, setFormList] =
    useState<FormWithOwnerType[]>(initialFormList);
  const [formListCount, setFormListCount] = useState(initialFormListCount);
  const [isFetchingFormList, setIsFetchingFormList] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [formFilterValues, setFormFilterValues] = useState<FormFilterValues>({
    creatorFilter: [],
  });

  const { setFormList: storeSetFormList } = useFormActions();

  const { register, handleSubmit, getValues, setValue, control } =
    useForm<SearchForm>({
      defaultValues: { isAscendingSort: false },
      mode: "onChange",
    });

  const { ref: creatorRef, focused: creatorRefFocused } = useFocusWithin();
  const handleFilterForms = async (
    { search, creatorList, isAscendingSort, status }: SearchForm = getValues()
  ) => {
    try {
      setIsFetchingFormList(true);

      const { data, count } = await getFormListWithFilter(supabaseClient, {
        teamId,
        app: "REQUEST",
        page: activePage,
        limit: DEFAULT_FORM_LIST_LIMIT,
        status: status,
        creator:
          creatorList && creatorList.length > 0 ? creatorList : undefined,
        sort: isAscendingSort ? "ascending" : "descending",
        search: search,
      });

      const result = data as FormWithOwnerType[];
      setFormList(result);
      setFormListCount(count || 0);
    } catch {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsFetchingFormList(false);
    }
  };

  const handleFilterChange = async (
    key: keyof FormFilterValues,
    value: string[]
  ) => {
    const filterMatch = formFilterValues[`${key}`];
    if (value !== filterMatch) {
      await handleFilterForms();
    }
    setFormFilterValues((prev) => ({ ...prev, [`${key}`]: value }));
  };

  const handleUpdateFormVisibility = async (id: string, isHidden: boolean) => {
    try {
      await updateFormVisibility(supabaseClient, {
        formId: id,
        isHidden: !isHidden,
      });

      const newForm = formList.map((form) => {
        if (form.form_id !== id) return form;
        return { ...form, form_is_hidden: !isHidden };
      });

      const newFormForNav = forms.map((form) => {
        if (form.form_id !== id) return form;
        return { ...form, form_is_hidden: !isHidden };
      });

      setFormList(newForm);
      storeSetFormList(newFormForNav);

      notifications.show({
        message: "Form visibility updated.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleDeleteForm = async (id: string) => {
    try {
      await deleteForm(supabaseClient, {
        formId: id,
      });

      const newFormList = formList.filter((form) => form.form_id !== id);
      const newFormForNav = forms.filter((form) => form.form_id !== id);
      setFormList(newFormList);
      storeSetFormList(newFormForNav);

      notifications.show({
        message: "Form deleted.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const creatorData = teamMemberList.map((member) => {
    return {
      value: member.team_member_id,
      label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
    };
  });

  const statusData = [
    {
      value: "visible",
      label: "Visible only",
    },
    {
      value: "hidden",
      label: "Hidden only",
    },
  ];

  return (
    <Container p={0} fluid>
      <Title order={2}>Forms </Title>

      <form onSubmit={handleSubmit(handleFilterForms)}>
        <Flex gap="lg" align="center" wrap="wrap" mt="xl">
          <Controller
            control={control}
            name="isAscendingSort"
            defaultValue={true}
            render={({ field: { value } }) => {
              return (
                <Tooltip
                  label={
                    getValues("isAscendingSort") ? "Ascending" : "Descending"
                  }
                  openDelay={800}
                >
                  <ActionIcon
                    disabled={isFetchingFormList}
                    onClick={async () => {
                      setValue(
                        "isAscendingSort",
                        !getValues("isAscendingSort")
                      );

                      await handleFilterForms();
                    }}
                    size={36}
                    color="dark.3"
                    variant="outline"
                  >
                    {value ? (
                      <IconSortAscending size={18} />
                    ) : (
                      <IconSortDescending size={18} />
                    )}
                  </ActionIcon>
                </Tooltip>
              );
            }}
          />

          <TextInput
            placeholder="Search form..."
            rightSection={
              <ActionIcon disabled={isFetchingFormList} size="xs" type="submit">
                <IconSearch />
              </ActionIcon>
            }
            {...register("search")}
          />

          <Controller
            control={control}
            name="creatorList"
            render={({ field: { value, onChange } }) => (
              <MultiSelect
                data={creatorData}
                placeholder="Creator"
                value={value}
                onChange={async (value) => {
                  onChange(value);
                  if (!creatorRefFocused)
                    handleFilterChange("creatorFilter", value);
                }}
                onDropdownClose={() =>
                  handleFilterChange("creatorFilter", value)
                }
                ref={creatorRef}
                color={creatorRefFocused ? "green" : "red"}
                clearable
                searchable
              />
            )}
          />

          <Controller
            control={control}
            name="status"
            render={({ field: { value, onChange } }) => (
              <Select
                data={statusData}
                placeholder="Status"
                value={value}
                onChange={async (value) => {
                  onChange(value);
                  await handleFilterForms();
                }}
                clearable
              />
            )}
          />
        </Flex>
      </form>

      <Container m={0} p={0} pos="relative" fluid>
        <LoadingOverlay
          visible={isFetchingFormList}
          overlayBlur={2}
          transitionDuration={500}
        />
        <Flex
          justify={formList.length > 0 ? "flex-start" : "center"}
          align="center"
          gap="md"
          wrap="wrap"
          mih={170}
          mt="xl"
        >
          {formList.sort((a, b) => a.form_name.localeCompare(b.form_name))
            .length > 0 ? (
            formList.map((form) => (
              <FormCard
                form={form}
                onDeleteForm={() => {
                  openConfirmModal({
                    title: <Text>Delete Form</Text>,
                    children: (
                      <Text size={14}>
                        Are you sure you want to delete
                        <Text weight={700} span>
                          &nbsp;
                          {startCase(form.form_name)}
                        </Text>
                        ?
                      </Text>
                    ),
                    labels: { confirm: "Delete", cancel: "Cancel" },
                    centered: true,
                    confirmProps: { color: "red" },
                    onConfirm: () => handleDeleteForm(form.form_id),
                  });
                }}
                onHideForm={() =>
                  openConfirmModal({
                    title: <Text>Form Visibility</Text>,
                    children: (
                      <Text size={14}>
                        Are you sure you want to{" "}
                        {form.form_is_hidden ? "unhide" : "hide"}
                        <Text weight={700} span>
                          &nbsp;
                          {startCase(form.form_name)}
                        </Text>
                        ?
                      </Text>
                    ),
                    labels: {
                      confirm: form.form_is_hidden ? "Unhide" : "Hide",
                      cancel: "Cancel",
                    },
                    centered: true,
                    confirmProps: {
                      color: form.form_is_hidden ? "blue" : "orange",
                    },
                    onConfirm: () =>
                      handleUpdateFormVisibility(
                        form.form_id,
                        form.form_is_hidden
                      ),
                  })
                }
                key={form.form_id}
              />
            ))
          ) : (
            <Text align="center" size={24} weight="bolder" color="dark.1">
              No form/s found
            </Text>
          )}
        </Flex>
      </Container>

      <Pagination
        value={activePage}
        total={Math.ceil(formListCount / DEFAULT_FORM_LIST_LIMIT)}
        onChange={async (value) => {
          setActivePage(value);
          await handleFilterForms();
        }}
        mt="xl"
        disabled={isFetchingFormList}
        position="right"
      />

      {/* {selectedForm !== null && (
        <>
          <DeleteFormModal
            opened={isDeletingForm}
            onClose={() => setIsDeletingForm(false)}
            onDeleteForm={async () => {
              await handleDeleteForm(selectedForm?.form_id);
              setIsDeletingForm(false);
            }}
          />

          <ToggleHideFormModal
            opened={isHidingForm}
            onClose={() => setIsHidingForm(false)}
            onToggleHideForm={async () => {
              await handleUpdateFormVisibility(
                selectedForm?.form_id,
                selectedForm?.form_is_hidden
              );
              setIsHidingForm(false);
            }}
            isHidden={selectedForm?.form_is_hidden}
          />
        </>
      )} */}
    </Container>
  );
};

export default RequestFormListPage;
