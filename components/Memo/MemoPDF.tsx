import { formatDate } from "@/utils/constant";
import { MemoType } from "@/utils/types";
import {
  Document,
  Image,
  Line,
  Page,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { MemoFormatFormValues } from "../MemoFormatEditor/MemoFormatEditor";

// removed temporarily to resolve 'fs' error
// const Html = dynamic(() => import("react-pdf-html"), {
//   ssr: false,
// });

const styles = StyleSheet.create({
  memoHeaderInput: {
    display: "flex",
    flexDirection: "row",
    gap: "16px",
  },
  divider: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    marginTop: "8px",
  },
  memoLineItem: {
    lineHeight: 1,
    marginBottom: "8px",
  },
  memoSigner: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "24px",
    marginLeft: "12px",
    marginRight: "12px",
    marginTop: "48px",
  },
  logo: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  noSignature: {
    border: "1px solid gray",
    backgroundColor: "#f8f9fa",
    marginBottom: "4px",
    height: "50px",
    width: "75px",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
  },
});

const getSubsectionJustify = (subsection: string) => {
  switch (subsection) {
    case "left":
      return "flex-start";
    case "center":
      return "center";
    case "right":
      return "flex-end";

    default:
      return "flex-start";
  }
};

type Props = {
  memo: MemoType;
  currentSignedSignerList: MemoType["memo_signer_list"];
  sortMemoLineItems: MemoType["memo_line_item_list"];
  memoFormat: MemoFormatFormValues["formatSection"];
};

const MemoPDF = ({
  memo,
  currentSignedSignerList,
  sortMemoLineItems,
  memoFormat,
}: Props) => {
  const header = memoFormat.filter(
    (format) => format.memo_format_section_name === "header"
  )[0];
  const body = memoFormat.filter(
    (format) => format.memo_format_section_name === "body"
  )[0];
  const footer = memoFormat.filter(
    (format) => format.memo_format_section_name === "footer"
  )[0];

  const sectionStyleSheet = StyleSheet.create({
    header: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignContent: "center",
      margin: `${header.memo_format_section_margin_top}px ${header.memo_format_section_margin_right}px ${header.memo_format_section_margin_bottom}px ${header.memo_format_section_margin_left}px`,
      minHeight: 30,
    },
    body: {
      margin: `${body.memo_format_section_margin_top}px ${body.memo_format_section_margin_right}px ${body.memo_format_section_margin_bottom}px ${body.memo_format_section_margin_left}px`,
      flex: 1,
    },
    footer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignContent: "center",
      margin: `${footer.memo_format_section_margin_top}px ${footer.memo_format_section_margin_right}px ${footer.memo_format_section_margin_bottom}px ${footer.memo_format_section_margin_left}px`,
      minHeight: 30,
    },
  });

  // const lineItemStyleSheet = {
  //   "*": {
  //     fontSize: "10pt",
  //     margin: "4px 0px 8px 0px",
  //     lineHeight: "normal",
  //   },
  // };
  const memoAuthorFullname = `${memo.memo_author_user.user_first_name} ${memo.memo_author_user.user_last_name}`;

  const renderLineItems = sortMemoLineItems.map((lineItem, lineItemIndex) => {
    // const lineItemContentHtml = marked(lineItem.memo_line_item_content);

    return (
      <View key={lineItem.memo_line_item_id} style={styles.memoLineItem}>
        {/* // removed temporarily to resolve 'fs' error */}
        {/* <Html stylesheet={lineItemStyleSheet}>
          {lineItemContentHtml as string}
        </Html> */}
        <View>
          {lineItem.memo_line_item_attachment
            ?.memo_line_item_attachment_name && (
            <View style={{ marginTop: "4px" }}>
              <Text style={{ fontWeight: 600, marginBottom: 4 }}>
                Figure {lineItemIndex + 1}
              </Text>
              <Image
                src={
                  lineItem.memo_line_item_attachment
                    .memo_line_item_attachment_public_url
                }
                style={{
                  height: "200px",
                  width: "100%",
                  objectFit: "contain",
                }}
              />
              {lineItem.memo_line_item_attachment
                .memo_line_item_attachment_caption && (
                <Text>
                  {`Caption ${lineItemIndex + 1}: ${
                    lineItem.memo_line_item_attachment
                      .memo_line_item_attachment_caption
                  }`}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  });

  const renderSignerList = currentSignedSignerList.map((signer) => {
    const signerFullname = `${signer.memo_signer_team_member.user.user_first_name} ${signer.memo_signer_team_member.user.user_last_name}`;
    return (
      <View key={signer.memo_signer_id}>
        {signer.memo_signer_signature_public_url ? (
          <Image
            src={signer.memo_signer_signature_public_url}
            style={{ height: "50px", width: "75px", objectFit: "contain" }}
          />
        ) : (
          <View style={styles.noSignature}>
            <Text>{"NO\nSIGNATURE"}</Text>
          </View>
        )}
        <Text style={{ fontWeight: 600, marginBottom: "2px" }}>
          {signerFullname}
        </Text>
        <Text>{signer.memo_signer_team_member.user.user_job_title}</Text>
      </View>
    );
  });

  const renderHeader = () => {
    return (
      <View style={sectionStyleSheet.header} fixed>
        {header.format_subsection.map((subsection) => {
          // const textStyleSheet = {
          //   "*": {
          //     fontSize: `${subsection.memo_format_subsection_text_font_size}px`,
          //     margin: 0,
          //   },
          // };

          return (
            <View
              key={subsection.memo_format_subsection_id}
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                height: "auto",
                justifyContent: getSubsectionJustify(
                  `${subsection.memo_format_subsection_name}`
                ),
                alignItems: "center",
                alignContent: "center",
              }}
            >
              {subsection.memo_format_subsection_text && (
                <View>
                  {/* // removed temporarily to resolve 'fs' error */}
                  {/* <Html stylesheet={textStyleSheet}>
                    {marked(subsection.memo_format_subsection_text) as string}
                  </Html> */}
                </View>
              )}
              {subsection.subsection_attachment.length > 0 &&
                subsection.subsection_attachment.map((attachment) => (
                  <Image
                    key={attachment.memo_format_attachment_id}
                    src={attachment.memo_format_attachment_url}
                    style={{
                      objectFit: "contain",
                      width: "90px",
                      height: "30px",
                    }}
                  />
                ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderFooter = () => {
    return (
      <View style={sectionStyleSheet.footer} fixed>
        {footer.format_subsection.map((subsection) => {
          // const textStyleSheet = {
          //   "*": {
          //     fontSize: `${subsection.memo_format_subsection_text_font_size}px`,
          //     margin: 0,
          //     wordBreak: "break-word",
          //   },
          // };
          return (
            <View
              key={subsection.memo_format_subsection_id}
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                height: "auto",
                justifyContent: getSubsectionJustify(
                  `${subsection.memo_format_subsection_name}`
                ),
                alignItems: "center",
                alignContent: "center",
              }}
            >
              {subsection.memo_format_subsection_text && (
                <View>
                  {/* // removed temporarily to resolve 'fs' error */}
                  {/* <Html stylesheet={textStyleSheet}>
                    {marked(subsection.memo_format_subsection_text) as string}
                  </Html> */}
                </View>
              )}
              {subsection.subsection_attachment.length > 0 &&
                subsection.subsection_attachment.map((attachment) => (
                  <Image
                    key={attachment.memo_format_attachment_id}
                    src={attachment.memo_format_attachment_url}
                    style={{
                      objectFit: "contain",
                      width: "90px",
                      height: "30px",
                    }}
                  />
                ))}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Document>
      <Page
        size="A4"
        style={{
          fontFamily: "Open Sans",
          fontSize: "10pt",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {renderHeader()}
        <View style={sectionStyleSheet.body}>
          <View>
            <Text
              style={{
                fontWeight: 600,
                fontSize: "12px",
                marginBottom: "12px",
              }}
            >
              MEMORANDUM
            </Text>
            <View style={styles.memoHeaderInput}>
              <Text style={{ fontWeight: 600, width: "54px" }}>Ref. No.</Text>
              <Text>:</Text>
              <Text>{memo.memo_reference_number}</Text>
            </View>
            <View style={styles.memoHeaderInput}>
              <Text style={{ fontWeight: 600, width: "54px" }}>Date</Text>
              <Text>:</Text>
              <Text>{formatDate(new Date(memo.memo_date_created))}</Text>
            </View>
            <View style={styles.memoHeaderInput}>
              <Text style={{ fontWeight: 600, width: "54px" }}>From</Text>
              <Text>:</Text>
              <Text>
                {memoAuthorFullname} - {memo.memo_author_user.user_job_title}
              </Text>
            </View>
            <View style={styles.memoHeaderInput}>
              <Text style={{ fontWeight: 600, width: "54px" }}>Subject</Text>
              <Text>:</Text>
              <Text style={{ fontWeight: 600 }}>{memo.memo_subject}</Text>
            </View>
          </View>
          <View style={styles.divider}>
            <Svg height="2" width="100%">
              <Line
                x1="0"
                y1="0"
                x2="1000"
                y2="0"
                strokeWidth={2}
                stroke="rgb(0,0,0)"
              />
            </Svg>
            <Svg height="4" width="100%">
              <Line
                x1="0"
                y1="0"
                x2="1000"
                y2="0"
                strokeWidth={5}
                stroke="rgb(0,0,0)"
              />
            </Svg>
          </View>
          <View>{renderLineItems}</View>
          <View style={styles.memoSigner}>{renderSignerList}</View>
        </View>
        {renderFooter()}
      </Page>
    </Document>
  );
};

export default MemoPDF;
