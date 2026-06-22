import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BookingStatusBadge } from "./booking-status-badge";

describe("BookingStatusBadge", () => {
  it("renders the label for each status", () => {
    const { rerender } = render(<BookingStatusBadge status="PENDING" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();

    rerender(<BookingStatusBadge status="APPROVED" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();

    rerender(<BookingStatusBadge status="REJECTED" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });
});
