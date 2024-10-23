import {
  AttachmentTableRow,
  BackgroundCheckTableRow,
  HRPhoneInterviewTableRow,
  JobOfferTableRow,
  RequestViewRow,
  TechnicalInterviewTableRow,
  TradeTestTableRow,
} from "@/utils/types";
import {
  Badge,
  Button,
  Center,
  Container,
  Flex,
  Paper,
  Stepper,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBan,
  IconCalendarExclamation,
  IconCircleCheck,
  IconCircleX,
  IconClockOff,
  IconHeartHandshake,
  IconHourglass,
  IconProgress,
  IconTag,
} from "@tabler/icons-react";
import { useState } from "react";
import ApplicationInformation from "./ApplicationInformation";
import BackgroundCheck from "./BackgroundCheck";
import GeneralAssessment from "./GeneralAssessment";
import HRPhoneInterview from "./HRPhoneInterview";
import JobOffer from "./JobOffer";
import TechnicalAssessment from "./TechnicalAssessment";
import TechnicalInterview from "./TechnicalInterview";
import TradeTest from "./TradeTest";

type Props = {
  applicationInformationData: RequestViewRow;
  generalAssessmentData?: RequestViewRow;
  technicalAssessmentData?: RequestViewRow;
  hrPhoneInterviewData?: HRPhoneInterviewTableRow;
  technicalInterview1Data?: TechnicalInterviewTableRow | null;
  technicalInterview2Data?: TechnicalInterviewTableRow | null;
  tradeTestData?: TradeTestTableRow | null;
  backgroundCheckData?: BackgroundCheckTableRow | null;
  jobOfferData?: (JobOfferTableRow & AttachmentTableRow) | null;
};
const ApplicationProgressPage = (props: Props) => {
  const {
    applicationInformationData,
    generalAssessmentData,
    technicalAssessmentData,
    hrPhoneInterviewData,
    technicalInterview1Data,
    technicalInterview2Data,
    tradeTestData,
    backgroundCheckData,
    jobOfferData,
  } = props;

  const [jobOfferStatus, setJobOfferStatus] = useState(
    jobOfferData?.job_offer_status ?? ""
  );

  const typeCastedProps = props as unknown as Record<string, string>;
  const keyIndexMatcher: Record<number, string> = {};
  const indexComponentMatcher: Record<string, JSX.Element | null> = {
    applicationInformationData: (
      <ApplicationInformation
        applicationInformationData={applicationInformationData}
        isWithNextStep={
          applicationInformationData.request_status === "APPROVED" &&
          !Boolean(generalAssessmentData)
        }
      />
    ),
    generalAssessmentData: generalAssessmentData ? (
      <GeneralAssessment
        generalAssessmentData={generalAssessmentData}
        isWithNextStep={
          generalAssessmentData.request_status === "APPROVED" &&
          !Boolean(technicalAssessmentData)
        }
      />
    ) : null,
    technicalAssessmentData: technicalAssessmentData ? (
      <TechnicalAssessment technicalAssessmentData={technicalAssessmentData} />
    ) : null,
    hrPhoneInterviewData: hrPhoneInterviewData ? (
      <HRPhoneInterview hrPhoneInterviewData={hrPhoneInterviewData} />
    ) : null,
    technicalInterview1Data: technicalInterview1Data ? (
      <TechnicalInterview
        technicalInterviewData={technicalInterview1Data}
        technicalInterviewNumber={
          technicalInterview2Data !== null ? 1 : undefined
        }
      />
    ) : null,
    technicalInterview2Data: technicalInterview2Data ? (
      <TechnicalInterview
        technicalInterviewData={technicalInterview2Data}
        technicalInterviewNumber={2}
      />
    ) : null,
    tradeTestData: tradeTestData ? (
      <TradeTest tradeTestData={tradeTestData} />
    ) : null,
    backgroundCheckData: backgroundCheckData ? (
      <BackgroundCheck backgroundCheckData={backgroundCheckData} />
    ) : null,
    jobOfferData: jobOfferData ? (
      <JobOffer
        jobOfferData={jobOfferData}
        jobOfferStatus={jobOfferStatus}
        setJobOfferStatus={setJobOfferStatus}
      />
    ) : null,
  };
  let maxValue = -1;
  let currentMaxValue = -1;
  Object.keys(props).forEach((key) => {
    if (Boolean(typeCastedProps[key])) {
      currentMaxValue += 1;
      maxValue += 1;
      keyIndexMatcher[maxValue] = key;
    } else {
      if (typeCastedProps[key] === undefined) {
        maxValue += 1;
        keyIndexMatcher[maxValue] = key;
      }
    }
  });

  const [stepperValue, setStepperValue] = useState(currentMaxValue);

  const stepperProps = (value: string) => {
    switch (value) {
      case "APPROVED":
      case "QUALIFIED":
      case "ACCEPTED":
        return {
          description: (
            <Badge color="green">
              <Text>{value}</Text>
            </Badge>
          ),
          icon: <IconCircleCheck color={"#40C057"} />,
          completedIcon: <IconCircleCheck color={"white"} />,
          color: "green",
        };
      case "REJECTED":
      case "NOT QUALIFIED":
        return {
          description: (
            <Badge color="red">
              <Text>{value}</Text>
            </Badge>
          ),
          icon: <IconCircleX color={"#FA5252"} />,
          completedIcon: <IconCircleX color={"white"} />,
          color: "red",
        };
      case "PENDING":
        return {
          description: (
            <Badge color="blue">
              <Text>{value}</Text>
            </Badge>
          ),
          icon: <IconProgress color={"#228BE6"} />,
          completedIcon: <IconProgress color={"white"} />,
          color: "blue",
        };
      case "WAITING FOR SCHEDULE":
        return {
          description: (
            <Badge color="orange">
              <Text>{value}</Text>
            </Badge>
          ),
          icon: <IconCalendarExclamation color={"#FD7E14"} />,
          completedIcon: <IconCalendarExclamation color={"white"} />,
          color: "orange",
        };
      case "NOT RESPONSIVE":
        return {
          description: (
            <Badge color="gray">
              <Text>{value}</Text>
            </Badge>
          ),
          icon: <IconAlertCircle color={"#868E96"} />,
          completedIcon: <IconAlertCircle color={"white"} />,
          color: "gray",
        };
      case "CANCELLED":
        return {
          description: (
            <Badge color="dark">
              <Text>{value}</Text>
            </Badge>
          ),
          icon: <IconBan color="#25262B" />,
          completedIcon: <IconBan color={"white"} />,
          color: "dark",
        };
      case "MISSED":
        return {
          description: (
            <Badge color="grape">
              <Text>{value}</Text>
            </Badge>
          ),
          icon: <IconClockOff color={"#BE4BDB"} />,
          completedIcon: <IconClockOff color={"white"} />,
          color: "grape",
        };
      case "WAITING FOR OFFER":
        return {
          description: (
            <Badge color="orange">
              <Text>{value}</Text>
            </Badge>
          ),
          icon: <IconTag color={"#FD7E14"} />,
          completedIcon: <IconTag color={"white"} />,
          color: "orange",
        };
      case "FOR POOLING":
        return {
          description: (
            <Badge color="yellow">
              <Text>{value}</Text>
            </Badge>
          ),
          icon: <IconHourglass color={"#FAB005"} />,
          completedIcon: <IconHourglass color={"white"} />,
          color: "yellow",
        };
      case "WITH ACCEPTED OFFER":
        return {
          description: (
            <Badge color="pink">
              <Text>{value}</Text>
            </Badge>
          ),
          icon: <IconHeartHandshake color={"#E64980"} />,
          completedIcon: <IconHeartHandshake color={"white"} />,
          color: "pink",
        };
    }
  };

  const renderContent = () => {
    return indexComponentMatcher[keyIndexMatcher[stepperValue]];
  };

  return (
    <Container fluid>
      <Title order={2} color="dimmed">
        Application Progress
      </Title>

      <Flex mt="xl" wrap="wrap" gap="xl">
        <Stepper
          active={stepperValue}
          onStepClick={setStepperValue}
          orientation="vertical"
          defaultValue="Application Information"
        >
          <Stepper.Step
            label="Application Information"
            disabled={!Boolean(applicationInformationData)}
            {...stepperProps(
              applicationInformationData?.request_status as string
            )}
          />
          <Stepper.Step
            label="General Assessment"
            disabled={!Boolean(generalAssessmentData)}
            {...stepperProps(generalAssessmentData?.request_status as string)}
          />
          <Stepper.Step
            label="Technical Assessment"
            disabled={!Boolean(technicalAssessmentData)}
            {...stepperProps(technicalAssessmentData?.request_status as string)}
          />
          <Stepper.Step
            label="HR Interview"
            disabled={!Boolean(hrPhoneInterviewData)}
            {...stepperProps(
              hrPhoneInterviewData?.hr_phone_interview_status as string
            )}
          />
          {technicalInterview1Data !== null && (
            <Stepper.Step
              label={"Department Interview"}
              disabled={!Boolean(technicalInterview1Data)}
              {...stepperProps(
                technicalInterview1Data?.technical_interview_status as string
              )}
            />
          )}
          {technicalInterview2Data !== null && (
            <Stepper.Step
              label="Requestor Interview"
              disabled={!Boolean(technicalInterview1Data)}
              {...stepperProps(
                technicalInterview2Data?.technical_interview_status as string
              )}
            />
          )}
          {tradeTestData !== null && (
            <Stepper.Step
              label="Practical Test"
              disabled={!Boolean(tradeTestData)}
              {...stepperProps(tradeTestData?.trade_test_status as string)}
            />
          )}
          {backgroundCheckData !== null && (
            <Stepper.Step
              label="Background Check"
              disabled={!Boolean(backgroundCheckData)}
              {...stepperProps(
                backgroundCheckData?.background_check_status as string
              )}
            />
          )}
          <Stepper.Step
            label="Job Offer"
            disabled={!Boolean(jobOfferData)}
            {...stepperProps(jobOfferStatus as string)}
          />
        </Stepper>
        <Paper p="xl" shadow="xs" sx={{ flex: 1 }}>
          <Flex direction="column" h="100%" justify="space-between">
            {renderContent()}
            <Center>
              <Flex gap="xs">
                <Button
                  w={100}
                  variant="light"
                  onClick={() => {
                    setStepperValue((prev) => prev - 1);
                  }}
                  disabled={stepperValue === 0}
                >
                  Previous
                </Button>
                <Button
                  w={100}
                  variant="light"
                  onClick={() => {
                    setStepperValue((prev) => prev + 1);
                  }}
                  disabled={stepperValue === currentMaxValue}
                >
                  Next
                </Button>
              </Flex>
            </Center>
          </Flex>
        </Paper>
      </Flex>
    </Container>
  );
};

export default ApplicationProgressPage;
