import { Heading, Text } from "@react-email/components";

import { EmailLayout, heading, text } from "./layout";

export type OverdueEmailProps = {
  name: string;
  propertyTitle: string;
  amount: string;
  periodLabel: string;
  isOwner: boolean;
};

export function OverdueEmail({
  name,
  propertyTitle,
  amount,
  periodLabel,
  isOwner,
}: OverdueEmailProps) {
  return (
    <EmailLayout preview={`Rent overdue for ${propertyTitle}`}>
      <Heading style={heading}>Rent overdue</Heading>
      <Text style={text}>Hi {name},</Text>
      {isOwner ? (
        <Text style={text}>
          The rent of <strong>{amount}</strong> for{" "}
          <strong>{propertyTitle}</strong> ({periodLabel}) is now overdue.
        </Text>
      ) : (
        <Text style={text}>
          Your rent of <strong>{amount}</strong> for{" "}
          <strong>{propertyTitle}</strong> ({periodLabel}) is now overdue.
          Please settle it as soon as possible.
        </Text>
      )}
    </EmailLayout>
  );
}

export default OverdueEmail;
