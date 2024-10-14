import { formatDate, formatTime } from "@/utils/constant";
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
  },
  section: {
    flexDirection: "column",
    gap: 12,
  },
  column: {
    flexDirection: "column",
    gap: 10,
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
    marginTop: 20,
    marginBottom: 20,
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
    borderLeft: "0.5px solid #dee2e6",
    borderRight: "0.5px solid #dee2e6",
  },
  tableCell: {
    margin: 5,
    fontSize: 8,
  },
  tableHeader: {
    margin: 5,
    fontSize: 8,
    fontWeight: "bold",
  },
  "General Name": {
    width: "15%",
  },
  "Base Unit of Measurement": {
    width: "8%",
  },
  Quantity: {
    width: "10%",
  },
  "GL Account": {
    width: "10%",
  },
  "CSI Code Description": {
    width: "10%",
  },
  "CSI Code": {
    width: "7%",
  },
  Description: {
    width: "40%",
  },
  badge: {
    padding: "0px 4px",
    borderRadius: "8px",
    fontSize: "7px",
    fontWeight: "bold",
    border: "solid 1px green",
    margin: 5,
  },
  flex: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    padding: 3,
    flexDirection: "row",
  },
  approved: {
    backgroundColor: "#EBFBEE",
    color: "#40C094",
  },
  rejected: {
    backgroundColor: "#FFF5F5",
    color: "#FA5252",
  },
  pending: {
    backgroundColor: "#E7F5FF",
    color: "#228BE6",
  },
  approverContainer: {
    display: "flex",
    width: "100%",
    flexDirection: "row",
  },
  approverColumn: {
    width: "100%",
    padding: 10,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  Signature: {
    width: "20%",
  },
  SignatureCell: {
    width: "20%",
    textAlign: "center",
  },
  "Full Name": {
    width: "20%",
  },
  Position: {
    width: "20%",
  },
  "Approval Status": {
    width: "20%",
  },
  "Date & Time Signed": {
    width: "20%",
  },
  icon: {
    width: "12px",
    height: "12px",
  },
  centerCell: {
    textAlign: "center",
  },
  cellFontSize: {
    fontSize: 8,
  },
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

const LiquidationReimbursementTableVersion = ({
  requestDetails,
  requestorDetails,
  requestIDs,
  requestItems,
  approverDetails,
}: Props) => {
  const formatStatus = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <View style={[styles.badge, styles.approved]}>
            <View style={styles.flex}>
              <Text>APPROVED</Text>
              <Image src="/check.png" style={styles.icon} />
            </View>
          </View>
        );
      case "REJECTED":
        return (
          <View style={[styles.badge, styles.rejected]}>
            <View style={styles.flex}>
              <Text>REJECTED</Text>
              <Image src="/cross.png" style={styles.icon} />
            </View>
          </View>
        );
      case "PENDING":
        return (
          <View style={[styles.badge, styles.pending]}>
            <View style={styles.flex}>
              <Text>PENDING</Text>
              <Image src="/dot.png" style={styles.icon} />
            </View>
          </View>
        );
      default:
        return <Text style={{ fontWeight: 600 }}></Text>;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.column}>
            {requestDetails.map((detail, index) => (
              <View key={index} style={styles.columnItem}>
                <Text>{detail.label}</Text>
                <Text style={{ fontWeight: 600 }}>{detail.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.column}>
            {requestorDetails.map((detail, index) => (
              <View
                key={index}
                style={{ ...styles.columnItem, alignItems: "flex-end" }}
              >
                <Text>{detail.label}</Text>
                <Text style={{ fontWeight: 600 }}>{detail.value}</Text>
                {detail.additional && (
                  <Text style={{ color: "#868E96" }}>
                    ({detail.additional})
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.header, { marginTop: "12px" }]}>
          <View style={styles.column}>
            {requestIDs.map((detail, index) => (
              <View
                key={index}
                style={{ ...styles.columnItem, alignItems: "flex-start" }}
              >
                <Text>{detail.label}</Text>
                <Text style={{ fontWeight: 600 }}>{detail.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <View style={styles.divider} />
          <Text style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
            {requestItems[0].title}
          </Text>
          <View style={styles.column}>
            {requestItems[0].fields.map((detail, i) => (
              <View key={i} style={styles.rowItem}>
                <Text>{detail.label}</Text>
                <Text style={{ fontWeight: 600 }}>{detail.value}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.divider} />
        <Fragment>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              Payee
            </Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, { backgroundColor: "#A5D8FF" }]}>
                <View style={[styles.tableCol, styles["Full Name"]]}>
                  <Text style={styles.tableHeader}>Date</Text>
                </View>
                <View style={[styles.tableCol, styles["Full Name"]]}>
                  <Text style={styles.tableHeader}>Supplier Name/Payee</Text>
                </View>
                <View style={[styles.tableCol, styles["Full Name"]]}>
                  <Text style={styles.tableHeader}>Type of Request</Text>
                </View>
                <View style={[styles.tableCol, styles["Full Name"]]}>
                  <Text style={styles.tableHeader}>Invoice Amount</Text>
                </View>
              </View>
              {requestItems
                .filter((section) => section.title === "Payee")
                .map((item, index) => {
                  return (
                    <View style={styles.tableRow} key={index} wrap={false}>
                      {item.fields.slice(0, 4).map((field, i) => (
                        <View
                          key={i}
                          style={[styles.tableCol, styles["Full Name"]]}
                        >
                          <Text style={styles.tableCell}>{field.value}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
            </View>
          </View>
        </Fragment>
        <View style={styles.divider} />
        <Fragment>
          <View>
            <Text style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              Payment
            </Text>
            <View style={styles.column}>
              {requestItems[requestItems.length - 1].fields.map((detail, i) => (
                <View key={i} style={styles.rowItem}>
                  <Text>{detail.label}</Text>
                  <Text style={{ fontWeight: 600 }}>{detail.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </Fragment>

        <Fragment>
          <View>
            <View style={styles.divider} />
            <Text style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              Approvers
            </Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, { backgroundColor: "#A5D8FF" }]}>
                <View style={[styles.tableCol, styles["Signature"]]}>
                  <Text style={styles.tableHeader}>Signature</Text>
                </View>
                <View style={[styles.tableCol, styles["Full Name"]]}>
                  <Text style={styles.tableHeader}>Full Name</Text>
                </View>
                <View style={[styles.tableCol, styles["Position"]]}>
                  <Text style={styles.tableHeader}>Position</Text>
                </View>
                <View style={[styles.tableCol, styles["Approval Status"]]}>
                  <Text style={styles.tableHeader}>Approval Status</Text>
                </View>
                <View style={[styles.tableCol, styles["Date & Time Signed"]]}>
                  <Text style={styles.tableHeader}>Date & Time Signed</Text>
                </View>
              </View>
              {approverDetails.map((approver, index) => {
                return (
                  <View style={styles.tableRow} key={index} wrap={false}>
                    <View style={[styles.tableCol, styles["SignatureCell"]]}>
                      {approver.signature && (
                        <Text>
                          <Image
                            src={approver.signature}
                            style={{
                              height: "50px",
                              width: "75px",
                            }}
                          />
                        </Text>
                      )}
                    </View>
                    <View style={[styles.tableCol, styles["Full Name"]]}>
                      <Text style={styles.tableCell}>{approver.name}</Text>
                    </View>
                    <View style={[styles.tableCol, styles["Position"]]}>
                      <Text style={styles.tableCell}>
                        {approver.jobDescription}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, styles["Approval Status"]]}>
                      {formatStatus(approver.status)}
                    </View>
                    <View
                      style={[styles.tableCol, styles["Date & Time Signed"]]}
                    >
                      <View style={(styles.tableCell, styles.centerCell)}>
                        {approver.date && (
                          <Text style={styles.cellFontSize}>
                            {`${formatDate(
                              new Date(approver.date)
                            )} ${formatTime(new Date(approver.date))}`}
                          </Text>
                        )}
                      </View>
                    </View>
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

export default LiquidationReimbursementTableVersion;

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
    />
    <View style={styles.logo}>
      <Text style={{ fontSize: 8 }}>Powered by</Text>
      <Image src="/logo-request-light.png" style={{ width: 45, height: 15 }} />
    </View>
  </View>
);
