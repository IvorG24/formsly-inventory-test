export type EmailNotificationTemplateProps = {
  message: string;
  greetingPhrase?: string;
  closingPhrase?: string;
  signature?: string;
};

const EmailNotificationTemplate = ({
  message,
  greetingPhrase = "Hi,",
  closingPhrase = "Thank you",
  signature = "Formsly Team",
}: EmailNotificationTemplateProps) => (
  <div>
    <p>{greetingPhrase}</p>
    <div dangerouslySetInnerHTML={{ __html: message }} />
    <p>{closingPhrase}</p>
    <p>{signature}</p>
  </div>
);

export default EmailNotificationTemplate;
