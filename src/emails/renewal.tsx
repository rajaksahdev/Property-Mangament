import { Button, Heading, Section, Text } from "@react-email/components";

import { EmailLayout, heading, text } from "./layout";

export type RenewalEmailProps = {
  ownerName: string;
  tenantName: string;
  propertyTitle: string;
  endLabel: string;
  daysLeft: number;
  actionUrl: string;
};

export function RenewalEmail({
  ownerName,
  tenantName,
  propertyTitle,
  endLabel,
  daysLeft,
  actionUrl,
}: RenewalEmailProps) {
  return (
    <EmailLayout preview={`Lease for ${propertyTitle} ends in ${daysLeft} days`}>
      <Heading style={heading}>Lease renewal coming up</Heading>
      <Text style={text}>Hi {ownerName},</Text>
      <Text style={text}>
        The lease for <strong>{propertyTitle}</strong> with{" "}
        <strong>{tenantName}</strong> ends on <strong>{endLabel}</strong> — in{" "}
        <strong>{daysLeft} days</strong>.
      </Text>
      <Section style={{ margin: "16px 0" }}>
        <Button
          href={actionUrl}
          style={{
            backgroundColor: "#171717",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: "8px",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          Review &amp; renew lease
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default RenewalEmail;
