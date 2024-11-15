import {
  DuplicateSectionType,
  FormTableRow,
  RequestResponseTableRow,
  RequestWithResponseType,
  Section,
} from "../types";

export const generateDuplicateSection = (originalSection: Section) => {
  const fieldResponse: RequestResponseTableRow[] =
    originalSection.section_field.flatMap((field) => field.field_response);

  const uniqueIdList = fieldResponse.reduce((unique, item) => {
    const { request_response_duplicatable_section_id } = item;
    // Check if the item's duplicatable_section_id is already in the unique array
    const isDuplicate = unique.some((uniqueItem) =>
      uniqueItem.includes(`${request_response_duplicatable_section_id}`)
    );
    // If the item is not a duplicate, add it to the unique array
    if (!isDuplicate) {
      unique.push(`${request_response_duplicatable_section_id}`);
    }

    return unique;
  }, [] as string[]);

  const duplicateSectionList = uniqueIdList.map((id) => {
    const duplicateSection = {
      ...originalSection,
      section_field: originalSection.section_field.map((field) => ({
        ...field,
        field_response:
          field.field_response.filter(
            (response) =>
              `${response.request_response_duplicatable_section_id}` === id
          )[0] || null,
      })),
    };
    return duplicateSection;
  });

  return duplicateSectionList;
};

export const generateSectionWithDuplicateList = (
  originalSectionList: Section[]
) => {
  const sectionWithDuplicateList: DuplicateSectionType[] = [];

  originalSectionList.forEach((section) => {
    const hasDuplicates = section.section_field.some((field) =>
      field.field_response.some(
        (response) => response.request_response_duplicatable_section_id !== null
      )
    );
    if (section.section_is_duplicatable && hasDuplicates) {
      const duplicateSection = generateDuplicateSection(section);
      duplicateSection.forEach((duplicateSection) =>
        sectionWithDuplicateList.push(duplicateSection)
      );
    } else {
      const sectionWithSingleResponse = {
        ...section,
        section_field: section.section_field.map((field) => ({
          ...field,
          field_response:
            field.field_response.filter(
              (response) =>
                response.request_response_duplicatable_section_id === null
            )[0] || null,
        })),
      };
      return sectionWithDuplicateList.push(sectionWithSingleResponse);
    }
  });

  return sectionWithDuplicateList;
};

export const areEqual = (array1: string[], array2: string[]) => {
  if (array1.length === array2.length) {
    return array1.every((element) => {
      if (array2.includes(element)) {
        return true;
      }
      return false;
    });
  }
  return false;
};

export const generateRequestDuplicateSection = (
  originalSection: RequestWithResponseType["request_form"]["form_section"][0]
) => {
  const fieldResponse: RequestResponseTableRow[] =
    originalSection.section_field.flatMap((field) => field.field_response);

  const uniqueIdList = fieldResponse.reduce((unique, item) => {
    const { request_response_duplicatable_section_id } = item;
    // Check if the item's duplicatable_section_id is already in the unique array
    const isDuplicate = unique.some((uniqueItem) =>
      uniqueItem.includes(`${request_response_duplicatable_section_id}`)
    );
    // If the item is not a duplicate, add it to the unique array
    if (!isDuplicate) {
      unique.push(`${request_response_duplicatable_section_id}`);
    }

    return unique;
  }, [] as string[]);

  const duplicateSectionList = uniqueIdList.map((id) => {
    const duplicateSection: RequestWithResponseType["request_form"]["form_section"][0] =
      {
        ...originalSection,
        section_field: originalSection.section_field.map((field) => ({
          ...field,
          field_response: [
            field.field_response.filter(
              (response) =>
                `${response.request_response_duplicatable_section_id}` === id
            )[0] || null,
          ],
        })),
      };
    return duplicateSection;
  });

  return duplicateSectionList;
};

export const parseRequest = (request: RequestWithResponseType) => {
  const {
    request_form: { form_section: originalSectionList },
  } = request;
  const sectionWithDuplicateList: RequestWithResponseType["request_form"]["form_section"] =
    [];

  originalSectionList.forEach((section) => {
    const hasDuplicates = section.section_field.some((field) =>
      field.field_response.some(
        (response) => response.request_response_duplicatable_section_id !== null
      )
    );
    if (section.section_is_duplicatable && hasDuplicates) {
      const duplicateSection = generateRequestDuplicateSection(section);
      duplicateSection.forEach((duplicateSection) =>
        sectionWithDuplicateList.push(duplicateSection)
      );
    } else {
      sectionWithDuplicateList.push(section);
    }
  });

  const returnData: RequestWithResponseType = {
    ...request,
    request_form: {
      ...request.request_form,
      form_section: sectionWithDuplicateList,
    },
  };

  return returnData;
};

export const parseItemSection = (originalSection: Section) => {
  const fieldWithResponse = originalSection.section_field.filter(
    (field) =>
      field.field_response.length > 0 && field.field_response[0] !== null
  );

  const section: Section = {
    ...originalSection,
    section_field: fieldWithResponse,
  };

  return section;
};

export const createRange = (start: number, end: number, step = 1) => {
  return Array.from(
    { length: Math.floor((end - start) / step) + 1 },
    (_, index) => start + index * step
  );
};
