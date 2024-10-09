import {
  fetchBarangay,
  fetchCity,
  fetchProvince,
  fetchRegion,
  getEmployeeName,
  getUserPendingInvitation,
} from "@/backend/api/get";
import {
  createTeamMemberReturnTeamName,
  createUser,
  createValidID,
  uploadImage,
} from "@/backend/api/post";
import { escapeQuotes, formatTeamNameToUrlKey, isUUID } from "@/utils/string";
import supabaseClientAddress from "@/utils/supabase/address";
import { OptionType } from "@/utils/types";
import { Container, Flex, LoadingOverlay, Paper } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  SupabaseClient,
  User,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { Database as OneOfficeDatabase } from "oneoffice-api";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import FirstStep from "./Steps/FirstStep";
import SecondStep from "./Steps/SecondStep";
import ThirdStep from "./Steps/ThirdStep";

export type OnboardUserParams = {
  user_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  user_username: string;
  user_avatar: string;
  user_phone_number: string;
  user_job_title: string;
  user_employee_number: string;
  user_id_type: string;
  user_id_number: string;
  user_id_first_name: string;
  user_id_middle_name: string;
  user_id_last_name: string;
  user_id_gender: string;
  user_id_nationality: string;
  user_id_region: string;
  user_id_province: string;
  user_id_city: string;
  user_id_barangay: string;
  user_id_street: string;
  user_id_zip_code: string;
  user_id_front_image: File | null;
  user_id_back_image: File | null;
};

type Props = {
  user: User;
};

const OnboardingPage = ({ user }: Props) => {
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [idType, setIdType] = useState<string | null>(null);
  const [regionOptions, setRegionOptions] = useState<OptionType[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<OptionType[]>([]);
  const [cityOptions, setCityOptions] = useState<OptionType[]>([]);
  const [barangayOptions, setBarangayOptions] = useState<OptionType[]>([]);
  const [zipCodeOptions, setZipCodeOptions] = useState<OptionType[]>([]);
  const [activeStep, setActiveStep] = useState(1);

  const totalSections = 3;

  useEffect(() => {
    try {
      setIsLoading(true);
      handleFetchRegionOptions();
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitOnboardingMethods = useForm<OnboardUserParams>({
    defaultValues: { user_id: user.id, user_email: user.email },
    reValidateMode: "onBlur",
  });

  const { handleSubmit, setValue, trigger } = submitOnboardingMethods;

  const handleOnboardUser = async (data: OnboardUserParams) => {
    setIsLoading(true);
    try {
      const { inviteTeamId } = router.query;
      const isValidTeamId = isUUID(inviteTeamId);

      const region = regionOptions.find(
        (options) => options.value === data.user_id_region
      )?.label;
      const province = provinceOptions.find(
        (options) => options.value === data.user_id_province
      )?.label;
      const city = cityOptions.find(
        (options) => options.value === data.user_id_city
      )?.label;
      const barangay = barangayOptions.find(
        (options) => options.value === data.user_id_barangay
      )?.label;

      if (!region || !province || !city || !barangay) throw new Error();

      let imageUrl = "";
      if (avatarFile) {
        imageUrl = await uploadImage(supabaseClient, {
          id: data.user_id,
          image: avatarFile,
          bucket: "USER_AVATARS",
        });
      }

      await createUser(supabaseClient, {
        user_id: data.user_id,
        user_email: data.user_email.trim(),
        user_first_name: data.user_first_name.trim(),
        user_last_name: data.user_last_name.trim(),
        user_username: data.user_username.trim(),
        user_phone_number: data.user_phone_number,
        user_job_title: escapeQuotes(data.user_job_title.trim()),
        user_active_team_id: isValidTeamId ? `${inviteTeamId}` : "",
        user_avatar: imageUrl,
        user_employee_number: data.user_employee_number,
      });

      let idFrontImage = "";
      if (data.user_id_front_image) {
        idFrontImage = await uploadImage(supabaseClient, {
          id: `${data.user_id}-front`,
          image: data.user_id_front_image,
          bucket: "USER_VALID_IDS",
        });
      }
      let idBackImage = "";
      if (data.user_id_back_image) {
        idBackImage = await uploadImage(supabaseClient, {
          id: `${data.user_id}-back`,
          image: data.user_id_back_image,
          bucket: "USER_VALID_IDS",
        });
      }

      await createValidID(supabaseClient, {
        user_valid_id_user_id: data.user_id,
        user_valid_id_type: escapeQuotes(data.user_id_type),
        user_valid_id_number: data.user_id_number.trim(),
        user_valid_id_first_name: data.user_first_name.trim(),
        user_valid_id_middle_name: data.user_id_middle_name.trim(),
        user_valid_id_last_name: data.user_last_name.trim(),
        user_valid_id_gender: data.user_id_gender.trim(),
        user_valid_id_nationality: data.user_id_nationality.trim(),
        user_valid_id_status: "PENDING",
        user_valid_id_front_image_url: idFrontImage,
        user_valid_id_back_image_url: idBackImage,
        address_region: escapeQuotes(region),
        address_province: escapeQuotes(province),
        address_city: escapeQuotes(city),
        address_barangay: escapeQuotes(barangay),
        address_street: escapeQuotes(data.user_id_street),
        address_zip_code: data.user_id_zip_code,
      });

      const pendingInvitation = await getUserPendingInvitation(supabaseClient, {
        userEmail: data.user_email,
      });

      if (isValidTeamId) {
        const team = await createTeamMemberReturnTeamName(supabaseClient, {
          team_member_team_id: `${inviteTeamId}`,
          team_member_user_id: data.user_id,
        });

        const activeTeamNameToUrl = formatTeamNameToUrlKey(
          team[0].team.team_name ?? ""
        );
        await router.push(`/${activeTeamNameToUrl}/dashboard?onboarding=true`);
      } else if (pendingInvitation) {
        await router.push(
          `/invitation/${pendingInvitation.invitation_id}?onboarding=true`
        );
      } else {
        await router.push("/user/requests");
      }

      notifications.show({
        message: "Profile completed.",
        color: "green",
      });
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const idLabel = idType === "Company ID" ? "Employee Number" : "ID Number";

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
      setValue("user_id_province", "");
      setValue("user_id_city", "");
      setValue("user_id_barangay", "");
      setValue("user_id_street", "");
      setValue("user_id_zip_code", "");
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
      setValue("user_id_region", "");
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
      setValue("user_id_city", "");
      setValue("user_id_barangay", "");
      setValue("user_id_street", "");
      setValue("user_id_zip_code", "");
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
      setValue("user_id_province", "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleFetchBarangayOptions = async (value: string | null) => {
    try {
      setBarangayOptions([]);
      setValue("user_id_barangay", "");
      setValue("user_id_street", "");
      setValue("user_id_zip_code", "");
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
      setValue("user_id_city", "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleFetchZipCode = async (value: string | null) => {
    try {
      if (!value) {
        setValue("user_id_zip_code", "");
        return;
      }

      const zipCode = zipCodeOptions.find((zipCode) => zipCode.value === value);
      if (!zipCode) {
        setValue("user_id_zip_code", "");
        return;
      }

      setValue("user_id_zip_code", zipCode.label);
    } catch (e) {
      setValue("user_id_zip_code", "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
    }
  };

  const handleEmployeeNumberChange = async (value: string | null) => {
    try {
      if (!value) return;
      const employee = await getEmployeeName(supabaseClient, {
        employeeId: value,
      });

      if (!employee) return;

      setValue("user_first_name", employee.scic_employee_first_name);
      setValue("user_last_name", employee.scic_employee_last_name);
    } catch (e) {
      notifications.show({
        message: "Failed to fetch employee data",
        color: "orange",
      });
    }
  };

  const handleChangeStep = async (action: "PREVIOUS" | "NEXT") => {
    setIsLoading(true);
    switch (action) {
      case "PREVIOUS":
        setActiveStep((prev) => prev - 1);
        break;

      case "NEXT":
        const isValid = await trigger();
        if (isValid) {
          setActiveStep((prev) => prev + 1);
        }
        break;

      default:
        break;
    }
    setIsLoading(false);
  };

  const renderActiveStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          <FirstStep
            activeStep={step}
            totalSections={totalSections}
            avatarFile={avatarFile}
            setAvatarFile={setAvatarFile}
            handleChangeStep={handleChangeStep}
            handleEmployeeNumberChange={handleEmployeeNumberChange}
          />
        );

      case 2:
        return (
          <SecondStep
            activeStep={step}
            totalSections={totalSections}
            idLabel={idLabel}
            regionOptions={regionOptions}
            provinceOptions={provinceOptions}
            setIdType={setIdType}
            handleFetchProvinceOptions={handleFetchProvinceOptions}
            handleFetchCityOptions={handleFetchCityOptions}
            handleChangeStep={handleChangeStep}
          />
        );

      case 3:
        return (
          <ThirdStep
            activeStep={step}
            totalSections={totalSections}
            cityOptions={cityOptions}
            barangayOptions={barangayOptions}
            handleFetchZipCode={handleFetchZipCode}
            handleFetchBarangayOptions={handleFetchBarangayOptions}
            handleChangeStep={handleChangeStep}
          />
        );

      default:
        return;
    }
  };

  return (
    <Container p={0} h="100%" fluid>
      <Flex h="100%" w="100%" justify="center" mt={{ sm: 45, lg: 75 }}>
        <Paper
          p={{ base: 24, sm: 32 }}
          shadow="sm"
          w={{ base: "100%", sm: 800 }}
          h={{ base: "100%", sm: 520 }}
          pos="relative"
        >
          <LoadingOverlay visible={isLoading} overlayBlur={2} />
          <FormProvider {...submitOnboardingMethods}>
            <form onSubmit={handleSubmit(handleOnboardUser)}>
              {renderActiveStep(activeStep)}
            </form>
          </FormProvider>
        </Paper>
      </Flex>
    </Container>
  );
};

export default OnboardingPage;
