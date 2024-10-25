import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { Fragment } from "react";

const styles = StyleSheet.create({
  page: {
    padding: "30pt 30pt 54pt",
    fontFamily: "Open Sans",
    fontSize: "10pt",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  lineItem: {
    flexDirection: "row",
    gap: 4,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    width: "100%",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    flexBasis: "100%",
    flex: 1,
  },
  section: {
    flexDirection: "column",
    gap: 4,
  },
  columnItem: {
    gap: 2,
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  divider: {
    borderBottom: "1px solid #495057",
    marginTop: 10,
    marginBottom: 10,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#495057",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logo: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  table: {
    width: "auto",
  },
  tableRow: {
    flexDirection: "row",
    borderTop: "1px solid #dee2e6",
    borderBottom: "1px solid #dee2e6",
    marginTop: "-0.5px",
  },
  tableCol: {
    fontSize: 8,
    borderLeft: "0.5px solid #dee2e6",
    borderRight: "0.5px solid #dee2e6",
  },
  tableHeader: {
    margin: 5,
    fontSize: 8,
    fontWeight: "bold",
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
    borderLeft: "0.5px solid #dee2e6",
    borderRight: "0.5px solid #dee2e6",
  },
  fullCell: { width: "40%" },
  minCell: { width: "20%" },
});

type FieldType = {
  label: string;
  value: string;
  additional?: string;
};

type Props = {
  requestDetails: FieldType[];
  requestorDetails: FieldType[];
  requestIDs: FieldType[];
  requestItems: {
    title: string;
    fields: FieldType[];
  }[];
  approverDetails: {
    name: string;
    status: string;
    date: string | null;
    jobDescription: string | null;
    signature: string | null;
  }[];
};

const PettyCashVoucherTableVersion = ({
  requestDetails,
  requestorDetails,
  requestIDs,
  requestItems,
}: Props) => {
  // Requestor Name, Project, Jira ticket, Amount, payee, Formlsy ID.
  const requestor = requestorDetails.find(
    (detail) => detail.label === "Requested by:"
  );
  const dateRequested = requestorDetails.find(
    (detail) => detail.label === "Date requested:"
  );
  const requestForm = requestDetails.find(
    (detail) => detail.label === "Form Name:"
  );
  const project = requestItems[1].fields.find(
    (detail) => detail.label === "Requesting Project Chargeable"
  );
  const formlsyId = requestIDs.find((detail) => detail.label === "Formsly ID:");
  const jiraId = requestIDs.find((detail) => detail.label === "Jira ID:");

  const payeeTableColumns = [
    "Particular Type",
    "Particular",
    "Unit Cost",
    "Amount",
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={{ fontWeight: 600 }}>Requested By:</Text>
                <Text>{requestor?.value}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={{ fontWeight: 600 }}>Form:</Text>
                <Text>{requestForm?.value}</Text>
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={{ fontWeight: 600 }}>Date Created:</Text>
                <Text>{dateRequested?.value}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={{ fontWeight: 600 }}>Formsly ID:</Text>
                <Text>{formlsyId?.value}</Text>
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={{ fontWeight: 600 }}>Project:</Text>
                <Text>{project?.value}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={{ fontWeight: 600 }}>Jira ID:</Text>
                <Text>{jiraId?.value || "No Jira ID"}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.divider} />
        <Fragment>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              Particular Details
            </Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, { backgroundColor: "#A5D8FF" }]}>
                <View style={[styles.tableCol, styles.minCell]}>
                  <Text style={styles.tableHeader}>Particular Type</Text>
                </View>
                <View style={[styles.tableCol, styles.fullCell]}>
                  <Text style={styles.tableHeader}>Particular</Text>
                </View>
                <View style={[styles.tableCol, styles.minCell]}>
                  <Text style={styles.tableHeader}>Unit Cost</Text>
                </View>
                <View style={[styles.tableCol, styles.minCell]}>
                  <Text style={styles.tableHeader}>Amount</Text>
                </View>
              </View>
              {requestItems
                .filter((section) => section.title === "Particular Details")
                .map((item, index) => {
                  return (
                    <View key={index} style={styles.tableRow} wrap={false}>
                      {item.fields
                        .filter((field) =>
                          payeeTableColumns.includes(field.label)
                        )
                        .map((field, i) => (
                          <View
                            key={i}
                            style={[
                              styles.tableCell,
                              [
                                "Amount",
                                "Unit Cost",
                                "Particular Type",
                              ].includes(field.label)
                                ? styles.minCell
                                : styles.fullCell,
                            ]}
                          >
                            <Text>{field.value}</Text>
                          </View>
                        ))}
                    </View>
                  );
                })}
            </View>
          </View>
        </Fragment>
        <Footer />
      </Page>
    </Document>
  );
};

export default PettyCashVoucherTableVersion;

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
    />
    <View style={styles.logo}>
      <Image src="/logo-request-light.png" style={{ width: 45, height: 15 }} />
    </View>
  </View>
);
