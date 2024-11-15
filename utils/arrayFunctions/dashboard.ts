import { DataItem } from "@/components/Dashboard/ItemTab/PurchaseTrend";
import { generateSectionWithDuplicateList } from "@/utils/arrayFunctions/arrayFunctions";
import {
  FieldType,
  FieldWithResponseType,
  LineChartDataType,
  PurchaseTrendChartDataType,
  RequestByFormType,
  RequestResponseDataType,
  ResponseDataType,
  SearchKeywordResponseType,
} from "../types";

export const searchResponseReducer = (data: SearchKeywordResponseType[]) => {
  return data.reduce((acc, item) => {
    const existingItem = acc.find(
      (x) => x.id === item.request_response_field_id
    );
    const label = item.response_field.field_name;
    const parseResponse = JSON.parse(item.request_response);
    const responseItem = { label: parseResponse, value: 1 };

    if (existingItem) {
      const duplicateResponseIndex = existingItem.responseList.findIndex(
        (d) => d.label === parseResponse
      );
      if (duplicateResponseIndex >= 0) {
        existingItem.responseList[duplicateResponseIndex].value++;
      } else {
        existingItem.responseList.push(responseItem);
      }
    } else {
      const newItem: ResponseDataType = {
        id: item.request_response_field_id,
        type: item.response_field.field_type as FieldType,
        label,
        optionList: [],
        responseList: [responseItem],
      };
      acc[acc.length] = newItem;
    }
    return acc;
  }, [] as ResponseDataType[]);
};

export const generateFormslyResponseData = (
  sectionList: RequestByFormType["request_form"]["form_section"],
  formName: string
) => {
  switch (formName) {
    case "Item":
      return generateRequsitionFormData(sectionList);
    default:
      break;
  }
};

export const generateRequsitionFormData = (
  sectionList: RequestByFormType["request_form"]["form_section"]
) => {
  const duplicateSectionList = generateSectionWithDuplicateList(sectionList);

  const sectionWithResponseList = duplicateSectionList.map((section) => {
    const sectionFields = section.section_field.filter(
      (field) => field.field_response !== null
    );

    return {
      ...section,
      section_field: sectionFields,
    };
  });

  const generalNameList = sectionWithResponseList.flatMap((section) =>
    section.section_field.filter((field) => field.field_name === "General Name")
  );

  const uniqueGeneralNameList = generalNameList.reduce((list, name) => {
    const parseResponse = JSON.parse(
      `${name.field_response?.request_response}`
    );
    if (!list.includes(parseResponse)) {
      list.push(parseResponse);
    }

    return list;
  }, [] as string[]);

  const groupSectionByGeneralName = uniqueGeneralNameList.map((generalName) => {
    // const responseData: FieldWithResponseType = [];

    const sectionWithGeneralNameMatch = sectionWithResponseList.filter(
      (section) => {
        const generalNameField = section.section_field.filter(
          (field) => field.field_name === "General Name"
        )[0];

        if (generalNameField) {
          const parseResponse = JSON.parse(
            `${generalNameField.field_response?.request_response}`
          );
          return parseResponse === generalName;
        } else {
          return false;
        }
      }
    );
    const sectionFieldResponse: FieldWithResponseType = [];
    sectionWithGeneralNameMatch.forEach((section) =>
      section.section_field.forEach((field) => {
        if (field.field_response) {
          const newFieldWithResponse = {
            ...field,
            field_option: field.field_option ? field.field_option : [],
            field_response: field.field_response ? [field.field_response] : [],
          };
          sectionFieldResponse.push(newFieldWithResponse);
        }
      })
    );

    const uniqueSectionField = sectionFieldResponse.reduce((acc, field) => {
      const duplicateFieldIndex = acc.findIndex(
        (f) => f.field_id === field.field_id
      );

      if (duplicateFieldIndex >= 0) {
        const updatedResponseList = [
          ...acc[duplicateFieldIndex].field_response,
          ...field.field_response,
        ];
        acc[duplicateFieldIndex].field_response = updatedResponseList;
      } else {
        acc.push(field);
      }

      return acc;
    }, [] as FieldWithResponseType);

    const itemSection = {
      sectionLabel: generalName,
      responseData: uniqueSectionField,
    };

    return itemSection;
  });

  return groupSectionByGeneralName;
};

export const getRequestFormData = (
  sectionList: RequestByFormType["request_form"]["form_section"]
) => {
  const filteredResponseTypes = ["TEXT", "TEXTAREA", "LINK", "FILE"];
  const fieldWithResponse: FieldWithResponseType = [];
  sectionList.forEach((section) =>
    section.section_field.forEach((field) => {
      if (field.field_response.length > 0) {
        fieldWithResponse.push(field);
      }
    })
  );
  const uniqueFieldList = fieldWithResponse.reduce((acc, field) => {
    const duplicateFieldIndex = acc.findIndex(
      (f) => f.field_id === field.field_id
    );

    if (duplicateFieldIndex >= 0) {
      const updatedResponseList = [
        ...acc[duplicateFieldIndex].field_response,
        ...field.field_response,
      ];
      acc[duplicateFieldIndex].field_response = updatedResponseList;
    } else {
      acc.push(field);
    }

    return acc;
  }, [] as FieldWithResponseType);
  const nonDynamicFieldList = uniqueFieldList.filter(
    (field) => !filteredResponseTypes.includes(field.field_type)
  );
  const groupedRequestFormData = nonDynamicFieldList.map((field) => {
    const isMultiSelect = field.field_type === "MULTISELECT";
    // get multiselect response
    const multiSelectResponseData: FieldWithResponseType[0]["field_response"] =
      [];

    if (isMultiSelect) {
      field.field_response.forEach((response) => {
        const parseResponse = JSON.parse(response.request_response);
        parseResponse.forEach((responseItem: string) => {
          const newResponse = {
            ...response,
            request_response: JSON.stringify(responseItem),
          };

          multiSelectResponseData.push(newResponse);
        });
      });
    }

    const multiSelectData = {
      ...field,
      field_response: multiSelectResponseData,
    };

    return {
      sectionLabel: field.field_name,
      responseData: [isMultiSelect ? multiSelectData : field],
    };
  });

  return groupedRequestFormData;
};

export const getUniqueResponseData = (
  data: FieldWithResponseType[0]["field_response"]
) => {
  const uniqueResponseData = data.reduce((acc, response) => {
    const parseResponseValue = JSON.parse(response.request_response);
    const duplicateResponseIndex = acc.findIndex(
      (res) => res.label === parseResponseValue
    );

    if (duplicateResponseIndex >= 0) {
      acc[duplicateResponseIndex].value++;
    } else {
      const newResponse = { label: parseResponseValue, value: 1 };
      acc.push(newResponse);
    }

    return acc;
  }, [] as LineChartDataType[]);

  const sortedUniqueResponseData = uniqueResponseData.sort(
    (a, b) => b.value - a.value
  );
  return sortedUniqueResponseData;
};

export const getChartData = (
  data: RequestResponseDataType[],
  options: { selectedPurchaseData: string; teamMemberId?: string }
) => {
  const itemQuantityData = data.reduce((acc, item) => {
    const quantityField = item.responseData.filter(
      (response) => response.field_name === "Quantity"
    );
    const quantityResponse = quantityField.flatMap(
      (field) => field.field_response
    );

    const selectedQuantityResponse =
      options.selectedPurchaseData === "user"
        ? quantityResponse.filter(
            (response) =>
              response.request_response_team_member_id === options.teamMemberId
          )
        : quantityResponse;

    const totalQuantity = selectedQuantityResponse.reduce((total, response) => {
      const quantityValue = JSON.parse(response.request_response);
      return total + quantityValue;
    }, 0);

    if (totalQuantity > 0) {
      const newItemData = {
        label: item.sectionLabel,
        value: totalQuantity,
      };
      acc.push(newItemData);
    }

    return acc;
  }, [] as LineChartDataType[]);

  return itemQuantityData;
};

export const getItemPurchaseTrendData = (data: RequestResponseDataType[]) => {
  const itemPurchaseTrendData = data.flatMap((d) => {
    const quantityFieldList = d.responseData.filter(
      (field) =>
        field.field_name === "Quantity" && field.field_response.length > 0
    );

    const newItemPurchaseTrend = quantityFieldList.flatMap((field) => {
      const fieldResponseWithItemName = field.field_response.map(
        (response) => ({
          ...response,
          request_response_item_general_name: d.sectionLabel,
        })
      );
      return fieldResponseWithItemName;
    });

    return newItemPurchaseTrend;
  });

  return itemPurchaseTrendData;
};

export const getItemStatusCount = (data: PurchaseTrendChartDataType[]) => {
  const itemStatusCount = data.reduce((acc, item) => {
    const parseResponse = JSON.parse(item.request_response);
    const requestStatus: string = item.request_response_request_status
      ? item.request_response_request_status
      : "";
    const itemMatch = acc.findIndex(
      (accItem) =>
        accItem.item === parseResponse && accItem.label === requestStatus
    );

    if (itemMatch >= 0 && requestStatus) {
      acc[itemMatch].value++;
    } else {
      const newItem = {
        label: requestStatus,
        value: 1,
        item: parseResponse,
      };
      acc.push(newItem);
    }

    return acc;
  }, [] as DataItem[]);

  return itemStatusCount;
};
