import { getRecruitmentData } from "@/backend/api/get";
import { Database } from "@/utils/database";
import { HRRecruitmentData } from "@/utils/types";
import {
  Button,
  LoadingOverlay,
  Modal,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { IconDownload } from "@tabler/icons-react";
import moment from "moment";
import { useState } from "react";
import { CSVLink } from "react-csv";

type Props = {
  opened: boolean;
  onClose: () => void;
};

const dataToExport = ["Application Information"];

const ExportToCSVModal = ({ opened, onClose }: Props) => {
  const supabaseClient = createPagesBrowserClient<Database>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedData, setSelectedData] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [csvData, setCSVData] = useState<HRRecruitmentData[]>([]);

  const handleExportToCSV = async () => {
    try {
      setIsLoading(true);
      if (!selectedData) {
        notifications.show({
          message: "Please select a data to export",
          color: "orange",
        });

        return;
      }

      if (!startDate && endDate) {
        notifications.show({
          message: "Please select a start date",
          color: "orange",
        });

        return;
      }

      let parsedStartDate = "";
      let parsedEndDate = "";

      if (startDate) {
        parsedStartDate = moment(startDate).format();
        parsedEndDate = moment(endDate ? endDate : undefined).format();
      }

      const recruitmentData: HRRecruitmentData[] = [];
      let offset = 0;
      const limit = 100;
      let fetchRecruitmentData = true;

      while (fetchRecruitmentData) {
        const data = await getRecruitmentData(supabaseClient, {
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          offset,
          limit,
        });

        if (data.length > 0) {
          recruitmentData.push(...data);
          offset += limit;
        }
        fetchRecruitmentData = data.length === limit;
      }

      if (recruitmentData.length === 0) {
        notifications.show({
          message: "Data is empty",
          color: "red",
        });

        return;
      }

      setCSVData(recruitmentData);
    } catch (error) {
      notifications.show({
        message: "Failed to export to csv",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnClose = () => {
    setSelectedData(null);
    setStartDate(null);
    setEndDate(null);
    setCSVData([]);
    onClose();
  };

  return (
    <Modal
      title="Export HR Data to CSV"
      opened={opened}
      onClose={handleOnClose}
      centered
    >
      <Stack p="sm">
        {csvData.length > 0 ? (
          <>
            <Text>Your data is ready for download.</Text>
            <Button size="md" leftIcon={<IconDownload size={16} />}>
              <CSVLink
                style={{ textDecoration: "none", color: "white" }}
                data={csvData}
                filename={`${selectedData}.csv`}
              >
                Download CSV
              </CSVLink>
            </Button>
          </>
        ) : (
          <>
            <LoadingOverlay visible={isLoading} />
            <Select
              label="Data to Export"
              placeholder="Select data to export"
              data={dataToExport}
              value={selectedData}
              onChange={setSelectedData}
              required
            />
            <DatePickerInput
              label="Start Date"
              placeholder="January 01, 2024"
              popoverProps={{ withinPortal: true }}
              valueFormat="MMMM DD, YYYY"
              value={startDate}
              onChange={setStartDate}
              required
            />
            <DatePickerInput
              label="End Date"
              placeholder={moment().format("MMMM DD, YYYY")}
              popoverProps={{ withinPortal: true }}
              valueFormat="MMMM DD, YYYY"
              maxDate={new Date()}
              value={endDate}
              onChange={setEndDate}
              required
            />
            <Button
              mt="md"
              size="md"
              onClick={() => handleExportToCSV()}
              disabled={isLoading}
            >
              Export to CSV
            </Button>
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default ExportToCSVModal;
