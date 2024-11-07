import {
  fetchBarangay,
  fetchCity,
  fetchProvince,
  fetchRegion,
  getAllApplicationInformationPositionOptions,
  getDegreeNameOptions,
  getFieldOfStudyOptions,
} from "@/backend/api/get";
import {
  createAdOwnerRequest,
  createRequest,
  insertError,
} from "@/backend/api/post";
import RequestFormDetails from "@/components/CreateRequestPage/RequestFormDetails";
import RequestFormSection from "@/components/CreateRequestPage/RequestFormSection";
import { useLoadingActions } from "@/stores/useLoadingStore";
import { FETCH_OPTION_LIMIT } from "@/utils/constant";
import { isError } from "@/utils/functions";
import { formatTeamNameToUrlKey } from "@/utils/string";
import supabaseClientAddress from "@/utils/supabase/address";
import {
  FormType,
  FormWithResponseType,
  OptionTableRow,
  PositionTableRow,
  RequestResponseTableRow,
} from "@/utils/types";
import { Box, Button, Container, Space, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  createPagesBrowserClient,
  SupabaseClient,
} from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { Database, Database as OneOfficeDatabase } from "oneoffice-api";
import { useEffect, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

export type Section = FormWithResponseType["form_section"][0];
export type Field = FormType["form_section"][0]["section_field"][0];

export type RequestFormValues = {
  sections: Section[];
};

export type FieldWithResponseArray = Field & {
  field_response: RequestResponseTableRow[];
};

type Props = {
  form: FormType;
};

const CreateApplicationInformationRequestPage = ({ form }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const router = useRouter();
  const user = useUser();

  const [regionOptionList, setRegionOptionsList] = useState<
    { region_id: string; region: string }[]
  >([]);
  const [provinceOptionList, setProvinceOptionList] = useState<
    { province_id: string; province: string }[]
  >([]);
  const [cityOptionList, setCityOptionList] = useState<
    { city_id: string; city: string }[]
  >([]);
  const [barangayOptionList, setBarangayOptionList] = useState<
    { barangay_id: string; barangay: string; barangay_zip_code: string }[]
  >([]);
  const [positionList, setPositionList] = useState<PositionTableRow[]>([]);
  const [loadingFieldList, setLoadingFieldList] = useState<
    { sectionIndex: number; fieldIndex: number }[]
  >([]);
  const [minimumExperience, setMinimumExperience] = useState(1);

  const { setIsLoading } = useLoadingActions();

  const formDetails = {
    form_name: form.form_name,
    form_description: form.form_description,
    form_date_created: form.form_date_created,
    form_team_member: form.form_team_member,
  };

  const requestFormMethods = useForm<RequestFormValues>();
  const { handleSubmit, control, getValues, setValue } = requestFormMethods;
  const {
    fields: formSections,
    insert: insertSection,
    remove: removeSection,
    update: updateSection,
    replace: replaceSection,
  } = useFieldArray({
    control,
    name: "sections",
  });

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        let index = 0;
        const positionOptionList: OptionTableRow[] = [];
        const positionList: PositionTableRow[] = [];
        while (1) {
          const positionData =
            await getAllApplicationInformationPositionOptions(supabaseClient, {
              teamId: form.form_team_member.team_member_team_id,
              index,
              limit: FETCH_OPTION_LIMIT,
            });

          const positionOptions = positionData.map((position, index) => {
            return {
              option_field_id: form.form_section[0].section_field[0].field_id,
              option_id: position.position_id,
              option_order: index,
              option_value: position.position_alias,
            };
          });
          positionOptionList.push(...positionOptions);
          positionList.push(...positionData);
          if (positionData.length < FETCH_OPTION_LIMIT) break;
          index += FETCH_OPTION_LIMIT;
        }
        setPositionList(positionList);

        const regionData = await fetchRegion(
          supabaseClientAddress as unknown as SupabaseClient<
            OneOfficeDatabase["address_schema"]
          >
        );
        if (!regionData) throw new Error();
        setRegionOptionsList(regionData);

        const regionOptionList = regionData.map((region, index) => {
          return {
            option_field_id: form.form_section[2].section_field[1].field_id,
            option_id: region.region_id,
            option_order: index,
            option_value: region.region,
          };
        });
        replaceSection([
          {
            ...form.form_section[0],
            section_field: [
              {
                ...form.form_section[0].section_field[0],
                field_option: positionOptionList.sort((a, b) =>
                  a.option_value.localeCompare(b.option_value)
                ),
              },
              ...form.form_section[0].section_field.slice(1, 3).map((field) => {
                return {
                  ...field,
                  field_is_read_only: true,
                  field_is_required: false,
                };
              }),
              ...form.form_section[0].section_field.slice(3),
            ],
          },
          form.form_section[1],
          {
            ...form.form_section[2],
            section_field: [
              ...form.form_section[2].section_field.slice(0, 2),
              {
                ...form.form_section[2].section_field[2],
                field_option: regionOptionList,
              },
              ...form.form_section[2].section_field.slice(3).map((field) => {
                return { ...field, field_is_read_only: true };
              }),
            ],
          },
          form.form_section[3],
          {
            ...form.form_section[5],
            section_field: [
              ...form.form_section[5].section_field.slice(0, 4),
              {
                ...form.form_section[5].section_field[4],
                field_option: regionOptionList,
              },
              ...form.form_section[5].section_field.slice(5),
            ],
          },
          ...form.form_section.slice(7),
        ]);
      } catch (e) {
        notifications.show({
          message: "Something went wrong. Please try again later.",
          color: "red",
        });
        if (isError(e)) {
          await insertError(supabaseClient, {
            errorTableRow: {
              error_message: e.message,
              error_url: router.asPath,
              error_function: "fetchOptions",
            },
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchOptions();
  }, [form, replaceSection, requestFormMethods]);

  const handleCreateRequest = async (data: RequestFormValues) => {
    if (!data.sections.length) {
      router.reload();
      return;
    }

    try {
      setIsLoading(true);
      let requestScore = 0;
      let workInformationIndex = 4;
      if (
        data.sections[workInformationIndex].section_name !== "Work Information"
      ) {
        workInformationIndex = 5;
      }

      if (
        data.sections[workInformationIndex].section_field[0].field_response ===
        "Unemployed"
      ) {
        requestScore += 2;
      }
      if (
        Number(
          data.sections[workInformationIndex].section_field[
            data.sections[workInformationIndex].section_field.length - 2
          ].field_response
        ) >= minimumExperience
      ) {
        requestScore += 2;
      } else {
        requestScore += 1;
      }

      const request = await createRequest(supabaseClient, {
        requestFormValues: data,
        formId: form.form_id,
        signers: form.form_signer,
        teamId: "a5a28977-6956-45c1-a624-b9e90911502e",
        requesterName: data.sections[1].section_field
          .slice(0, 3)
          .map((field) => field.field_response)
          .join(" "),
        formName: form.form_name,
        isFormslyForm: true,
        projectId: "",
        teamName: formatTeamNameToUrlKey(
          process.env.NODE_ENV === "production" ? "SCIC" : "Sta Clara"
        ),
        requestScore,
        recruiter: router.query.recruiter as string | undefined,
        userId: user?.id ?? "",
        sssId: (
          data.sections[3].section_field[0].field_response as string
        ).replace(/\D/g, ""),
      });

      const adOwnerId = router.query["ad-owner"] as string;
      if (adOwnerId) {
        const adOwnerRequest = {
          ad_owner_request_owner_id: adOwnerId,
          ad_owner_request_request_id: request.request_id,
        };
        await createAdOwnerRequest(supabaseClient, adOwnerRequest);
      }

      notifications.show({
        message: "Request created.",
        color: "green",
      });

      await router.push(`/public-request/${request.request_id}`);
    } catch (e) {
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleCreateRequest",
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateSection = (sectionId: string) => {
    const sectionLastIndex = formSections
      .map((sectionItem) => sectionItem.section_id)
      .lastIndexOf(sectionId);
    const sectionMatch = form.form_section.find(
      (section) => section.section_id === sectionId
    );
    let workExperienceSectionCount = 0;
    formSections.forEach((section) => {
      if (section.section_name === "Most Recent Work Experience") {
        workExperienceSectionCount++;
      }
    });
    if (workExperienceSectionCount === 3) {
      notifications.show({
        message: "Only 3 Most Recent Work Experience is needed.",
        color: "orange",
      });
      return;
    }
    if (sectionMatch) {
      const sectionDuplicatableId = uuidv4();
      const duplicatedFieldsWithDuplicatableId = sectionMatch.section_field.map(
        (field) => ({
          ...field,
          field_section_duplicatable_id: sectionDuplicatableId,
        })
      );
      const newSection = {
        ...sectionMatch,
        section_field: duplicatedFieldsWithDuplicatableId,
      };
      insertSection(sectionLastIndex + 1, newSection);
      return;
    }
  };

  const handleRemoveSection = (sectionDuplicatableId: string) => {
    const sectionMatchIndex = formSections.findIndex(
      (section) =>
        section.section_field[0].field_section_duplicatable_id ===
        sectionDuplicatableId
    );

    if (sectionMatchIndex) {
      if (formSections[sectionMatchIndex].section_field[0].field_response) {
        const option = formSections[
          sectionMatchIndex
        ].section_field[0].field_option.find(
          (fieldOption) =>
            fieldOption.option_value ===
            formSections[sectionMatchIndex].section_field[0].field_response
        ) as OptionTableRow;

        if (option) {
          const sectionList = getValues(`sections`);
          const itemSectionList = sectionList.slice(1);

          itemSectionList.forEach((section, sectionIndex) => {
            sectionIndex += 1;
            if (sectionIndex !== sectionMatchIndex) {
              updateSection(sectionIndex, {
                ...section,
                section_field: [
                  {
                    ...section.section_field[0],
                    field_option: [
                      ...section.section_field[0].field_option,
                      option,
                    ].sort((a, b) => {
                      return a.option_order - b.option_order;
                    }),
                  },
                  ...section.section_field.slice(1),
                ],
              });
            }
          });
        }
      }

      removeSection(sectionMatchIndex);
      return;
    }
  };

  const handlePositionChange = async (value: string | null) => {
    const newSection = getValues(`sections.0`);

    const isWithEducationalBackground = formSections.some(
      (section) => section.section_name === "Educational Background"
    );

    try {
      if (value) {
        setLoadingFieldList([{ sectionIndex: 0, fieldIndex: 0 }]);

        const position = positionList.find(
          (position) => position.position_alias === value
        );
        if (!position) throw new Error();

        setMinimumExperience(position.position_minimum_years_of_experience);

        updateSection(0, {
          ...newSection,
          section_field: [
            newSection.section_field[0],
            {
              ...form.form_section[0].section_field[1],
              field_is_required: Boolean(position.position_certificate_label),
              field_is_read_only: !Boolean(
                position.position_is_with_certificate
              ),
              field_description:
                position.position_certificate_label ?? undefined,
            },
            {
              ...form.form_section[0].section_field[2],
              field_is_required: Boolean(position.position_license_label),
              field_is_read_only: !Boolean(position.position_is_with_license),
              field_description: position.position_license_label ?? undefined,
            },
            newSection.section_field[newSection.section_field.length - 1],
          ],
        });

        if (
          position.position_classification === "NOT APPLICABLE" &&
          !isWithEducationalBackground
        ) {
          insertSection(
            4,
            {
              ...form.form_section[4],
              section_field: [
                form.form_section[4].section_field[0],
                ...form.form_section[4].section_field.slice(3),
              ],
            },
            { shouldFocus: false }
          );
          insertSection(6, form.form_section[6], { shouldFocus: false });
        } else if (
          (position.position_classification === "SKILLED" ||
            position.position_classification === "NON-SKILLED") &&
          isWithEducationalBackground
        ) {
          removeSection([4, 6]);
        }
      } else {
        updateSection(0, {
          ...newSection,
          section_field: [
            newSection.section_field[0],
            ...form.form_section[0].section_field.slice(1, 3).map((field) => {
              return {
                ...field,
                field_is_read_only: true,
                field_is_required: false,
              };
            }),
            ...newSection.section_field.slice(3),
          ],
        });

        if (isWithEducationalBackground) {
          removeSection([4, 6]);
        }
      }
    } catch (e) {
      setValue(`sections.0.section_field.0.field_response`, "");
      if (isWithEducationalBackground) {
        removeSection([4, 6]);
      }
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handlePositionChange",
          },
        });
      }
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleRegionChange = async (value: string | null) => {
    const newSection = getValues(`sections.2`);
    try {
      setLoadingFieldList([{ sectionIndex: 2, fieldIndex: 3 }]);
      setCityOptionList([]);
      setBarangayOptionList([]);

      if (value) {
        const regionId = regionOptionList.find(
          (region) => region.region === value
        )?.region_id;
        if (!regionId) throw new Error();

        const provinceData = await fetchProvince(
          supabaseClientAddress as unknown as SupabaseClient<
            OneOfficeDatabase["address_schema"]
          >,
          { regionId }
        );
        if (!provinceData) throw new Error();

        const provinceOption = provinceData.map((province, index) => {
          return {
            option_field_id: form.form_section[2].section_field[3].field_id,
            option_id: province.province_id,
            option_order: index,
            option_value: province.province,
          };
        });
        setProvinceOptionList(provinceData);

        updateSection(2, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 3),
            {
              ...newSection.section_field[3],
              field_option: provinceOption,
              field_is_read_only: false,
            },
            ...newSection.section_field.slice(4),
          ],
        });
      } else {
        updateSection(2, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 3),
            ...newSection.section_field.slice(3).map((field) => {
              return {
                ...field,
                field_response: "",
                field_option: [],
                field_is_read_only: true,
              };
            }),
          ],
        });
      }
    } catch (e) {
      updateSection(2, {
        ...newSection,
        section_field: [
          ...newSection.section_field.slice(0, 2),
          {
            ...newSection.section_field[2],
            field_response: "",
          },
          ...newSection.section_field.slice(3).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
              field_is_read_only: true,
            };
          }),
        ],
      });
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleRegionChange",
          },
        });
      }
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleProvinceChange = async (value: string | null) => {
    const newSection = getValues(`sections.2`);
    try {
      setLoadingFieldList([{ sectionIndex: 2, fieldIndex: 4 }]);
      setBarangayOptionList([]);

      if (value) {
        const provinceId = provinceOptionList.find(
          (province) => province.province === value
        )?.province_id;
        if (!provinceId) throw new Error();

        const cityData = await fetchCity(
          supabaseClientAddress as unknown as SupabaseClient<
            OneOfficeDatabase["address_schema"]
          >,
          { provinceId }
        );
        if (!cityData) throw new Error();

        const cityOption = cityData.map((city, index) => {
          return {
            option_field_id: form.form_section[2].section_field[4].field_id,
            option_id: city.city_id,
            option_order: index,
            option_value: city.city,
          };
        });
        setCityOptionList(cityData);

        updateSection(2, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 4),
            {
              ...newSection.section_field[4],
              field_option: cityOption,
              field_is_read_only: false,
            },
            ...newSection.section_field.slice(5),
          ],
        });
      } else {
        updateSection(2, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 4),
            ...newSection.section_field.slice(4).map((field) => {
              return {
                ...field,
                field_response: "",
                field_option: [],
                field_is_read_only: true,
              };
            }),
          ],
        });
      }
    } catch (e) {
      updateSection(2, {
        ...newSection,
        section_field: [
          ...newSection.section_field.slice(0, 3),
          {
            ...newSection.section_field[3],
            field_response: "",
          },
          ...newSection.section_field.slice(4).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
              field_is_read_only: true,
            };
          }),
        ],
      });
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleProvinceChange",
          },
        });
      }
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleCityChange = async (value: string | null) => {
    const newSection = getValues(`sections.2`);
    try {
      setLoadingFieldList([{ sectionIndex: 2, fieldIndex: 5 }]);

      if (value) {
        const cityId = cityOptionList.find(
          (city) => city.city === value
        )?.city_id;
        if (!cityId) throw new Error();

        const barangayData = await fetchBarangay(
          supabaseClientAddress as unknown as SupabaseClient<
            OneOfficeDatabase["address_schema"]
          >,
          { cityId }
        );
        if (!barangayData) throw new Error();

        const barangayOption = barangayData.map((barangay, index) => {
          return {
            option_field_id: form.form_section[2].section_field[5].field_id,
            option_id: barangay.barangay_id,
            option_order: index,
            option_value: barangay.barangay,
          };
        });
        setBarangayOptionList(barangayData);

        updateSection(2, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 5),
            {
              ...newSection.section_field[5],
              field_option: barangayOption,
              field_is_read_only: false,
            },
            ...newSection.section_field.slice(6),
          ],
        });
      } else {
        updateSection(2, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 5),
            ...newSection.section_field.slice(5).map((field) => {
              return {
                ...field,
                field_response: "",
                field_option: [],
                field_is_read_only: true,
              };
            }),
          ],
        });
      }
    } catch (e) {
      updateSection(2, {
        ...newSection,
        section_field: [
          ...newSection.section_field.slice(0, 4),
          {
            ...newSection.section_field[4],
            field_response: "",
          },
          ...newSection.section_field.slice(5).map((field) => {
            return {
              ...field,
              field_response: "",
              field_option: [],
              field_is_read_only: true,
            };
          }),
        ],
      });
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleCityChange",
          },
        });
      }
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleBarangayChange = async (value: string | null) => {
    const newSection = getValues(`sections.2`);
    try {
      setLoadingFieldList([
        { sectionIndex: 2, fieldIndex: 6 },
        { sectionIndex: 2, fieldIndex: 7 },
      ]);

      if (value) {
        const zipCode = barangayOptionList.find(
          (barangay) => barangay.barangay === value
        )?.barangay_zip_code;
        if (!zipCode) throw new Error();

        updateSection(2, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 6),
            {
              ...newSection.section_field[6],
              field_is_read_only: false,
            },
            {
              ...newSection.section_field[7],
              field_response: zipCode,
            },
          ],
        });
      } else {
        updateSection(2, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 6),
            {
              ...newSection.section_field[6],
              field_is_read_only: false,
              field_response: "",
            },
            {
              ...newSection.section_field[7],
              field_response: "",
            },
          ],
        });
      }
    } catch (e) {
      updateSection(2, {
        ...newSection,
        section_field: [
          ...newSection.section_field.slice(0, 6),
          {
            ...newSection.section_field[6],
            field_is_read_only: false,
            field_response: "",
          },
          {
            ...newSection.section_field[7],
            field_response: "",
          },
        ],
      });
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleBarangayChange",
          },
        });
      }
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleWillingToBeAssignedAnywhereChange = async (
    value: boolean,
    index: number
  ) => {
    const newSection = getValues(`sections.${index}`);
    if (value) {
      updateSection(index, {
        ...newSection,
        section_field: [
          ...newSection.section_field.slice(0, 4),
          ...newSection.section_field.slice(5),
        ],
      });
    } else {
      const regionOptions = regionOptionList.map((region, index) => {
        return {
          option_field_id: form.form_section[5].section_field[4].field_id,
          option_id: region.region_id,
          option_order: index,
          option_value: region.region,
        };
      });
      updateSection(index, {
        ...newSection,
        section_field: [
          ...newSection.section_field.slice(0, 4),
          {
            ...form.form_section[5].section_field[4],
            field_option: regionOptions,
          },
          ...newSection.section_field.slice(4),
        ],
      });
    }
  };

  const handleHighestEducationalAttainmentChange = async (
    value: string | null
  ) => {
    const newSection = getValues(`sections.4`);
    const newFieldList = [newSection.section_field[0]];

    const isDegreeRequired = value
      ? !["High School", "Vocational"].includes(value)
      : false;

    try {
      setLoadingFieldList([{ sectionIndex: 4, fieldIndex: 0 }]);

      if (value) {
        if (isDegreeRequired) {
          const fieldOfStudyOption = await getFieldOfStudyOptions(
            supabaseClient,
            {
              value,
            }
          );

          newFieldList.push(
            {
              ...form.form_section[4].section_field[1],
              field_option: fieldOfStudyOption.map((field, index) => {
                return {
                  option_field_id:
                    form.form_section[4].section_field[1].field_id,
                  option_id: uuidv4(),
                  option_order: index,
                  option_value: field,
                };
              }),
            },
            ...form.form_section[4].section_field.slice(2)
          );
        } else {
          newFieldList.push(...form.form_section[4].section_field.slice(3));
        }
        removeSection(4);
        insertSection(4, {
          ...newSection,
          section_field: newFieldList,
        });
      } else {
        removeSection(4);
        insertSection(4, {
          ...newSection,
          section_field: [
            newSection.section_field[0],
            ...form.form_section[4].section_field.slice(3),
          ],
        });
      }
    } catch (e) {
      setValue(`sections.4.section_field.0.field_response`, "");
      removeSection(4);
      insertSection(4, {
        ...newSection,
        section_field: [
          newSection.section_field[0],
          ...form.form_section[4].section_field.slice(3),
        ],
      });
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleHighestEducationalAttainmentChange",
          },
        });
      }
    } finally {
      setLoadingFieldList([]);
    }
  };

  const handleFieldOfStudyChange = async (value: string | null) => {
    const newSection = getValues(`sections.4`);

    try {
      setLoadingFieldList([{ sectionIndex: 4, fieldIndex: 2 }]);

      if (value) {
        const degreeNameData = await getDegreeNameOptions(supabaseClient, {
          degreeType: newSection.section_field[0].field_response as string,
          fieldOfStudy: value,
        });
        const degreeNameOptions = degreeNameData.map((degree, index) => {
          return {
            option_field_id: form.form_section[4].section_field[2].field_id,
            option_id: uuidv4(),
            option_order: index,
            option_value: degree,
          };
        });

        updateSection(4, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 2),
            {
              ...form.form_section[4].section_field[2],
              field_option: degreeNameOptions,
            },
            ...newSection.section_field.slice(3),
          ],
        });
      } else {
        updateSection(4, {
          ...newSection,
          section_field: [
            ...newSection.section_field.slice(0, 2),
            {
              ...form.form_section[4].section_field[2],
              field_option: [],
            },
            ...newSection.section_field.slice(3),
          ],
        });
      }
    } catch (e) {
      setValue(`sections.4.section_field.1.field_response`, "");
      notifications.show({
        message: "Something went wrong. Please try again later.",
        color: "red",
      });
      if (isError(e)) {
        await insertError(supabaseClient, {
          errorTableRow: {
            error_message: e.message,
            error_url: router.asPath,
            error_function: "handleFieldOfStudyChange",
          },
        });
      }
    } finally {
      setLoadingFieldList([]);
    }
  };

  return (
    <Container>
      <Title order={2} color="dimmed">
        Create Request
      </Title>
      <Space h="xl" />
      <FormProvider {...requestFormMethods}>
        <form onSubmit={handleSubmit(handleCreateRequest)}>
          <Stack spacing="xl">
            <RequestFormDetails formDetails={formDetails} />
            {formSections.map((section, idx) => {
              const sectionIdToFind = section.section_id;
              const sectionLastIndex = getValues("sections")
                .map((sectionItem) => sectionItem.section_id)
                .lastIndexOf(sectionIdToFind);

              return (
                <Box key={section.id}>
                  <RequestFormSection
                    key={section.section_id}
                    section={section}
                    sectionIndex={idx}
                    formslyFormName={form.form_name}
                    loadingFieldList={loadingFieldList}
                    onRemoveSection={handleRemoveSection}
                    applicationInformationFormMethods={{
                      onPositionChange: handlePositionChange,
                      onRegionChange: handleRegionChange,
                      onProvinceChange: handleProvinceChange,
                      onCityChange: handleCityChange,
                      onBarangayChange: handleBarangayChange,
                      onWillingToBeAssignedAnywhereChange:
                        handleWillingToBeAssignedAnywhereChange,
                      onHighestEducationalAttainmentChange:
                        handleHighestEducationalAttainmentChange,
                      onFieldOfStudyChange: handleFieldOfStudyChange,
                    }}
                  />
                  {section.section_is_duplicatable &&
                    idx === sectionLastIndex && (
                      <Button
                        mt="md"
                        variant="default"
                        onClick={() =>
                          handleDuplicateSection(section.section_id)
                        }
                        fullWidth
                      >
                        {section.section_name} +
                      </Button>
                    )}
                </Box>
              );
            })}
            {/* <RequestFormSigner signerList={signerList} /> */}
            <Button type="submit">Submit</Button>
          </Stack>
        </form>
      </FormProvider>
    </Container>
  );
};

export default CreateApplicationInformationRequestPage;
