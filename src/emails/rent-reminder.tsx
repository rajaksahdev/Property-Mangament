import { Heading, Text } from "@react-email/components";

import { EmailLayout, heading, text } from "./layout";

export type RentReminderEmailProps = {
  tenantName: string;
  propertyTitle: string;
  amount: string;
  dueLabel: string;
  dueSoon: boolean;
};

export function RentReminderEmail({
  tenantName,
  propertyTitle,
  amount,
  dueLabel,
  dueSoon,
}: RentReminderEmailProps) {
  return (
    <EmailLayout
      preview={dueSoon ? "Your rent is due soon" : "Your rent is due today"}
    >
      <Heading style={heading}>
        Rent {dueSoon ? "due soon" : "due today"}
      </Heading>
      <Text style={text}>Hi {tenantName},</Text>
      <Text style={text}>
        This is a reminder that rent of <strong>{amount}</strong> for{" "}
        <strong>{propertyTitle}</strong> is due on <strong>{dueLabel}</strong>.
      </Text>
      <Text style={text}>
        Please make your payment on time to avoid late fees.
      </Text>
    </EmailLayout>
  );
}

export default RentReminderEmail;
