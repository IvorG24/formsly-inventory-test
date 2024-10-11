import { Button, Flex } from "@mantine/core";

type Props = {
  activeStep: number;
  handleChangeStep: (action: "PREVIOUS" | "NEXT") => Promise<void>;
  disableSubmit?: boolean;
};

const SubmitSection = ({
  activeStep,
  handleChangeStep,
  disableSubmit,
}: Props) => {
  return (
    <Flex
      gap={{ base: "sm", sm: "md" }}
      direction={{ base: "column-reverse", sm: "row" }}
      justify={{ sm: "flex-end" }}
      mb={{ base: 24, sm: 0 }}
    >
      {activeStep > 1 && (
        <Button
          variant="outline"
          w={{ base: "100%", sm: 120 }}
          sx={{ fontSize: 16 }}
          onClick={() => handleChangeStep("PREVIOUS")}
        >
          Go Back
        </Button>
      )}
      {activeStep < 2 ? (
        <Button
          w={{ base: "100%", sm: 120 }}
          sx={{ fontSize: 16 }}
          onClick={() => handleChangeStep("NEXT")}
        >
          Next
        </Button>
      ) : (
        <Button
          w={{ base: "100%", sm: 120 }}
          sx={{ fontSize: 16 }}
          type="submit"
          disabled={disableSubmit}
        >
          Submit
        </Button>
      )}
    </Flex>
  );
};

export default SubmitSection;
