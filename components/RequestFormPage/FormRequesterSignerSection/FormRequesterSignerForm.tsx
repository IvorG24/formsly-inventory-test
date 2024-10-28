import { useTeamMemberList } from "@/stores/useTeamMemberStore";
import { RequesterPrimarySignerFormValues } from "@/utils/types";
import {
  Autocomplete,
  Button,
  LoadingOverlay,
  Modal,
  MultiSelect,
  Select,
  Stack,
} from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form";

type Props = {
  opened: boolean;
  close: () => void;
  onSubmit: (data: RequesterPrimarySignerFormValues) => void;
  isLoading?: boolean;
  isUpdate?: boolean;
};

const FormRequesterSignerForm = ({
  opened,
  close,
  onSubmit,
  isLoading = false,
  isUpdate = false,
}: Props) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useFormContext<RequesterPrimarySignerFormValues>();
  const teamMemberList = useTeamMemberList();
  const teamMemberOptions = teamMemberList.map((member) => ({
    value: member.team_member_id,
    label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
  }));
  const approverList = teamMemberList.filter(
    (member) => member.team_member_role !== "MEMBER"
  );
  const approverOptions = approverList.map((member) => ({
    value: member.team_member_id,
    label: `${member.team_member_user.user_first_name} ${member.team_member_user.user_last_name}`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={`${isUpdate ? "Update" : "Create"} Department Signer`}
      centered
      pos="relative"
    >
      <LoadingOverlay overlayBlur={2} visible={isLoading} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <Controller
            name="requester_team_member_id"
            control={control}
            render={({ field: { onChange, value } }) => (
              <MultiSelect
                label="Requester"
                searchable
                data={teamMemberOptions}
                withinPortal
                value={value}
                onChange={onChange}
                error={errors.requester_team_member_id?.message}
                required
              />
            )}
          />
          <Controller
            name="requester_primary_signer_signer_id"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Select
                label="Signer"
                searchable
                data={approverOptions}
                withinPortal
                value={value}
                onChange={onChange}
                error={errors.requester_primary_signer_signer_id?.message}
                required
              />
            )}
          />
          <Controller
            name={"signer_action"}
            control={control}
            render={({ field: { onChange, value } }) => (
              <Autocomplete
                label="Select Action"
                data={["APPROVED", "NOTED", "PURCHASED"]}
                withinPortal={true}
                value={value}
                error={errors.signer_action?.message}
                onChange={onChange}
                required
              />
            )}
            rules={{ required: "This field is required." }}
          />
          <Button type="submit" disabled={isLoading}>
            Submit
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};

export default FormRequesterSignerForm;
