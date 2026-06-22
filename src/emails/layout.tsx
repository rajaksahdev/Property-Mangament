import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

const main = {
  backgroundColor: "#f6f7f9",
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #eaeaea",
  borderRadius: "8px",
  padding: "28px 32px",
  maxWidth: "480px",
  margin: "0 auto",
};

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {children}
          <Hr style={{ borderColor: "#eeeeee", margin: "24px 0 12px" }} />
          <Text style={{ color: "#9aa0a6", fontSize: "12px", margin: 0 }}>
            Property Manager · This is an automated message.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const heading = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 12px",
};
export const text = { fontSize: "14px", color: "#374151", lineHeight: "22px" };
