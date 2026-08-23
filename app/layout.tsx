import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SQS Validator",
  description: "Secure query system (SQS) data validator",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
