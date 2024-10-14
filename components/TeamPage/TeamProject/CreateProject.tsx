import {
  checkIfTeamProjectExists,
  fetchBarangay,
  fetchCity,
  fetchProvince,
  fetchRegion,
} from "@/backend/api/get";
import { createAttachment, createTeamProject } from "@/backend/api/post";
import { useActiveTeam } from "@/stores/useTeamStore";
import { useUserProfile } from "@/stores/useUserStore";
import { MAX_FILE_SIZE, MAX_FILE_SIZE_IN_MB } from "@/utils/constant";
import { Database } from "@/utils/database";
import { escapeQuotes } from "@/utils/string";
import supabaseClientAddress from "@/utils/supabase/address";
import { OptionType } from "@/utils/types";
import {
  Button,
  Container,
  Divider,
  FileInput,
  LoadingOverlay,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  SupabaseClient,
  createPagesBrowserClient,
} from "@supabase/auth-helpers-nextjs";
import { IconFile } from "@tabler/icons-react";
import { Database as OneOfficeDatabase } from "oneoffice-api";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type ProjectForm = {
  projectName: string;
  site_map: File;
  boq: File;
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
  zipCode: string;
};

type Props = {
  setIsCreatingProject: Dispatch<SetStateAction<boolean>>;
  handleFetch: (search: string, page: number) => void;
};

const CreateProject = ({ setIsCreatingProject, handleFetch }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const activeTeam = useActiveTeam();
  const user = useUserProfile();

  const [isFetchingOptions, setIsFetchingOptions] = useState(true);
  const [regionOptions, setRegionOptions] = useState<OptionType[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<OptionType[]>([]);
  const [cityOptions, setCityOptions] = useState<OptionType[]>([]);
  const [barangayOptions, setBarangayOptions] = useState<OptionType[]>([]);
  const [zipCodeOptions, setZipCodeOptions] = useState<OptionType[]>([]);

  const { register, formState, handleSubmit, control, setValue, watch } =
    useForm<ProjectForm>({
      defaultValues: {
        projectName: "",
      },
    });

  const generateProjectInitials = (projectName: string) => {
    const words = projectName.split(" ");
    let initials = "";

    if (words.length === 1) {
      const firstTwoLetters = words[0].slice(0, 2);
      initials = firstTwoLetters.toUpperCase();
    } else {
      for (const word of words) {
        if (word.length > 0) {
          initials += word[0].toUpperCase();
          if (initials.length >= 2) {
            break;
          }
        }
      }
    }

    return initials;
  };

  const onSubmit = async (data: ProjectForm) => {
    try {
      if (!user) return;
      const projectName = data.projectName.trim().toUpperCase();
      const projectInitials = generateProjectInitials(projectName);
      if (
        await checkIfTeamProjectExists(supabaseClient, {
          teamId: activeTeam.team_id,
          projectName: projectName,
        })
      ) {
        notifications.show({
          message: `Team project ${projectName} already exists`,
          color: "orange",
        });
        return;
      }

      let boqAttachmentId = "";
      let siteMapAttachmentId = "";

      if (data.boq) {
        const { data: boqData } = await createAttachment(supabaseClient, {
          file: data.boq,
          attachmentData: {
            attachment_bucket: "TEAM_PROJECT_ATTACHMENTS",
            attachment_name: data.boq.name,
            attachment_value: "",
          },
          fileType: "boq",
          userId: user.user_id,
        });
        boqAttachmentId = boqData.attachment_id;
      }

      if (data.site_map) {
        const { data: siteMapData } = await createAttachment(supabaseClient, {
          file: data.site_map,
          attachmentData: {
            attachment_bucket: "TEAM_PROJECT_ATTACHMENTS",
            attachment_name: data.site_map.name,
            attachment_value: "",
          },
          fileType: "sm",
          userId: user.user_id,
        });
        siteMapAttachmentId = siteMapData.attachment_id;
      }

      const region = regionOptions.find(
        (options) => options.value === data.region
      )?.label;
      const province = provinceOptions.find(
        (options) => options.value === data.province
      )?.label;
      const city = cityOptions.find(
        (options) => options.value === data.city
      )?.label;
      const barangay = barangayOptions.find(
        (options) => options.value === data.barangay
      )?.label;

      if (!region || !province || !city || !barangay) throw new Error();

      await createTeamProject(supabaseClient, {
        teamProjectName: projectName,
        teamProjectInitials: projectInitials,
        teamProjectTeamId: activeTeam.team_id,
        siteMapId: siteMapAttachmentId,
        boqId: boqAttachmentId,
        region: escapeQuotes(region),
        province: escapeQuotes(province),
        city: escapeQuotes(city),
        barangay: escapeQuotes(barangay),
        street: escapeQuotes(data.street),
        zipCode: data.zipCode,
      });
      handleFetch("", 1);

      notifications.show({
        message: "Team project created.",
        color: "green",
      });
      setIsCreatingProject(false);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
    return;
  };

  const watchBarangay = watch("barangay");

  useEffect(() => {
    try {
      setIsFetchingOptions(true);
      handleFetchRegionOptions();
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsFetchingOptions(false);
    }
  }, [setIsCreatingProject]);

  const handleFetchRegionOptions = async () => {
    const data = await fetchRegion(
      supabaseClientAddress as unknown as SupabaseClient<
        OneOfficeDatabase["address_schema"]
      >
    );

    setRegionOptions(
      data?.map((region) => {
        return {
          label: region.region,
          value: region.region_id,
        };
      }) ?? []
    );
  };

  const handleFetchProvinceOptions = async (value: string | null) => {
    try {
      setProvinceOptions([]);
      setCityOptions([]);
      setBarangayOptions([]);
      setValue("province", "");
      setValue("city", "");
      setValue("barangay", "");
      setValue("street", "");
      setValue("zipCode", "");
      if (!value) {
        return;
      }

      const data = await fetchProvince(
        supabaseClientAddress as unknown as SupabaseClient<
          OneOfficeDatabase["address_schema"]
        >,
        { regionId: value }
      );

      setProvinceOptions(
        data?.map((province) => {
          return {
            label: province.province,
            value: province.province_id,
          };
        }) ?? []
      );
    } catch (e) {
      setValue("region", "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleFetchCityOptions = async (value: string | null) => {
    try {
      setCityOptions([]);
      setBarangayOptions([]);
      setValue("city", "");
      setValue("barangay", "");
      setValue("street", "");
      setValue("zipCode", "");
      if (!value) return;

      const data = await fetchCity(
        supabaseClientAddress as unknown as SupabaseClient<
          OneOfficeDatabase["address_schema"]
        >,
        { provinceId: value }
      );
      setCityOptions(
        data?.map((city) => {
          return {
            label: city.city,
            value: city.city_id,
          };
        }) ?? []
      );
    } catch (e) {
      setValue("province", "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleFetchBarangayOptions = async (value: string | null) => {
    try {
      setBarangayOptions([]);
      setValue("barangay", "");
      setValue("street", "");
      setValue("zipCode", "");
      if (!value) return;

      const data = await fetchBarangay(
        supabaseClientAddress as unknown as SupabaseClient<
          OneOfficeDatabase["address_schema"]
        >,
        { cityId: value }
      );
      setBarangayOptions(
        data?.map((barangay) => {
          return {
            label: barangay.barangay,
            value: barangay.barangay_id,
          };
        }) ?? []
      );
      setZipCodeOptions(
        data?.map((barangay) => {
          return {
            label: barangay.barangay_zip_code,
            value: barangay.barangay_id,
          };
        }) ?? []
      );
    } catch (e) {
      setValue("city", "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleFetchZipCode = async (value: string | null) => {
    try {
      if (!value) {
        setValue("zipCode", "");
        return;
      }

      const zipCode = zipCodeOptions.find((zipCode) => zipCode.value === value);
      if (!zipCode) {
        setValue("zipCode", "");
        return;
      }

      setValue("zipCode", zipCode.label);
    } catch (e) {
      setValue("zipCode", "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  return (
    <Container p={0} fluid sx={{ position: "relative" }}>
      <LoadingOverlay visible={formState.isSubmitting || isFetchingOptions} />
      <Stack spacing={16}>
        <Title m={0} p={0} order={3}>
          Add Project
        </Title>
        <Divider mb="xl" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing="xl">
            <Stack>
              <TextInput
                {...register("projectName", {
                  validate: {
                    required: (value) =>
                      value.trim() ? true : "Project Name is required",
                    minLength: (value) =>
                      value.trim().length > 2
                        ? true
                        : "Project Name must have atleast 3 characters",
                    maxLength: (value) =>
                      value.trim().length < 500
                        ? true
                        : "Project Name must be shorter than 500 characters",
                  },
                })}
                withAsterisk
                w="100%"
                label="Project Name"
                sx={{
                  input: {
                    textTransform: "uppercase",
                  },
                }}
                error={formState.errors.projectName?.message}
              />
              <Controller
                control={control}
                name="site_map"
                render={({ field }) => (
                  <FileInput
                    label="Site Map"
                    icon={<IconFile size={16} />}
                    clearable
                    multiple={false}
                    onChange={field.onChange}
                    error={formState.errors.site_map?.message}
                  />
                )}
                rules={{
                  validate: {
                    fileSize: (value) => {
                      if (!value) return true;
                      const formattedValue = value as File;
                      return formattedValue.size <= MAX_FILE_SIZE
                        ? true
                        : `File exceeds ${MAX_FILE_SIZE_IN_MB}mb`;
                    },
                  },
                }}
              />
              <Controller
                control={control}
                name="boq"
                render={({ field }) => (
                  <FileInput
                    label="BOQ"
                    icon={<IconFile size={16} />}
                    clearable
                    multiple={false}
                    onChange={field.onChange}
                    error={formState.errors.boq?.message}
                  />
                )}
                rules={{
                  validate: {
                    fileSize: (value) => {
                      if (!value) return true;
                      const formattedValue = value as File;
                      return formattedValue.size <= MAX_FILE_SIZE
                        ? true
                        : `File exceeds ${MAX_FILE_SIZE_IN_MB}mb`;
                    },
                  },
                }}
              />
            </Stack>

            <Stack>
              <Title order={4}>Address</Title>
              <Controller
                control={control}
                name="region"
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="Region"
                    data={regionOptions}
                    required
                    clearable
                    searchable
                    onChange={async (value) => {
                      await handleFetchProvinceOptions(value);
                      onChange(value);
                    }}
                    value={value}
                    error={formState.errors.region?.message}
                  />
                )}
                rules={{
                  required: {
                    value: true,
                    message: "Region is required",
                  },
                }}
              />
              <Controller
                control={control}
                name="province"
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="Province"
                    data={provinceOptions}
                    required
                    clearable
                    searchable
                    onChange={async (value) => {
                      await handleFetchCityOptions(value);
                      onChange(value);
                    }}
                    value={value}
                    error={formState.errors.province?.message}
                    disabled={provinceOptions.length === 0}
                  />
                )}
                rules={{
                  required: {
                    value: true,
                    message: "Province is required",
                  },
                }}
              />
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="City"
                    data={cityOptions}
                    required
                    clearable
                    searchable
                    onChange={async (value) => {
                      await handleFetchBarangayOptions(value);
                      onChange(value);
                    }}
                    value={value}
                    error={formState.errors.city?.message}
                    disabled={cityOptions.length === 0}
                  />
                )}
                rules={{
                  required: {
                    value: true,
                    message: "City is required",
                  },
                }}
              />
              <Controller
                control={control}
                name="barangay"
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="Barangay"
                    data={barangayOptions}
                    required
                    clearable
                    searchable
                    onChange={(value) => {
                      setValue("street", "");
                      handleFetchZipCode(value);
                      onChange(value);
                    }}
                    value={value}
                    error={formState.errors.barangay?.message}
                    disabled={barangayOptions.length === 0}
                  />
                )}
                rules={{
                  required: {
                    value: true,
                    message: "Barangay is required",
                  },
                }}
              />
              <TextInput
                {...register("street", {
                  validate: {
                    required: (value) =>
                      value.trim() ? true : "Street is required",
                    minLength: (value) =>
                      value.trim().length > 1
                        ? true
                        : "Street must have atleast 2 characters",
                    maxLength: (value) =>
                      value.trim().length < 500
                        ? true
                        : "Street must be shorter than 500 characters",
                  },
                })}
                withAsterisk
                w="100%"
                label="Street"
                error={formState.errors.street?.message}
                disabled={!watchBarangay}
              />
              <TextInput
                {...register("zipCode", {
                  validate: {
                    required: (value) =>
                      value.trim() ? true : "Zip Code is required",
                  },
                })}
                withAsterisk
                w="100%"
                label="Zip Code"
                error={formState.errors.zipCode?.message}
                variant="filled"
              />
            </Stack>
          </Stack>

          <Button type="submit" miw={100} mt={30} mr={14}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            miw={100}
            mt={30}
            mr={14}
            onClick={() => setIsCreatingProject(false)}
          >
            Cancel
          </Button>
        </form>
      </Stack>
    </Container>
  );
};

export default CreateProject;
