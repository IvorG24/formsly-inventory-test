import { Button, Group, Modal, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type UpdateModalProps = {
  opened: boolean;
  close: () => void;
  typeId: string;
  type: string;
  initialData?: string;
  initialDescription?: string;
};

type FormValues = {
  updatedValue: string;
};

const UpdateModal = ({
  opened,
  close,
  type,
  typeId,
  initialData = "",
  initialDescription = "",
}: UpdateModalProps) => {
  const supabaseClient = useSupabaseClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: { updatedValue: initialData },
  });

  useEffect(() => {
    if (opened) {
      reset({ updatedValue: initialData });
    }
  }, [opened, initialData, reset]);

  const handleUpdate = async (data: FormValues) => {
    try {
      const { updatedValue } = data;
      close();
      notifications.show({
        message: `${type} updated successfully`,
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: `Something went wrong`,
        color: "red",
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      centered
      size="xl"
      withinPortal
      title={`Update ${type}`}
    >
      <form onSubmit={handleSubmit(handleUpdate)}>
        <Controller
          name="updatedValue"
          control={control}
          rules={{ required: "This field is required" }}
          render={({ field }) => (
            <TextInput
              label={`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} Name`}
              placeholder={`Enter new ${type} name`}
              error={errors.updatedValue?.message}
              required
              {...field}
            />
          )}
        />
        {initialDescription && (
          <Controller
            name="updatedValue"
            control={control}
            rules={{ required: "This field is required" }}
            render={({ field }) => (
              <TextInput
                label={`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} Name`}
                placeholder={`Enter new ${type} name`}
                error={errors.updatedValue?.message}
                required
                {...field}
              />
            )}
          />
        )}
        <Group position="right" mt="md">
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          <Button color="blue" type="submit">
            Update
          </Button>
        </Group>
      </form>
    </Modal>
  );
};

export default UpdateModal;
