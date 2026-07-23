import { describe, it, expect } from "vitest";
import {
  validateBookingForm,
  defaultNumVehiclesFor,
  CUSTOMER_TYPE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  type BookingFormInput,
} from "./booking-validation";

const TODAY = new Date("2026-07-20T00:00:00");

const VALID_INPUT: BookingFormInput = {
  fullName: "Nadia Khoury",
  companyName: "Khoury Logistics",
  phone: "+961 3 123 456",
  email: "nadia@khourylogistics.com",
  customerType: "Truck and Transportation Fleet",
  numVehicles: "5",
  vehicleType: "Trucks",
  preferredArea: "Beirut",
  preferredDate: "2026-07-25",
  message: "",
};

describe("validateBookingForm", () => {
  it("returns no errors for a fully valid submission", () => {
    expect(validateBookingForm(VALID_INPUT, TODAY)).toEqual({});
  });

  it("requires full name, phone, email, customer type, vehicle type, and area", () => {
    const errors = validateBookingForm(
      {
        ...VALID_INPUT,
        fullName: "",
        phone: "",
        email: "",
        customerType: "",
        vehicleType: "",
        preferredArea: "",
      },
      TODAY,
    );
    expect(errors.fullName).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.customerType).toBeDefined();
    expect(errors.vehicleType).toBeDefined();
    expect(errors.preferredArea).toBeDefined();
  });

  it("rejects a malformed email address", () => {
    const errors = validateBookingForm(
      { ...VALID_INPUT, email: "not-an-email" },
      TODAY,
    );
    expect(errors.email).toBeDefined();
  });

  it("requires a company name for business customer types", () => {
    const errors = validateBookingForm(
      { ...VALID_INPUT, companyName: "" },
      TODAY,
    );
    expect(errors.companyName).toBeDefined();
  });

  it("does not require a company name for Private Vehicle Owner", () => {
    const errors = validateBookingForm(
      {
        ...VALID_INPUT,
        customerType: "Private Vehicle Owner",
        companyName: "",
      },
      TODAY,
    );
    expect(errors.companyName).toBeUndefined();
  });

  it("rejects a non-positive or non-integer number of vehicles", () => {
    expect(
      validateBookingForm({ ...VALID_INPUT, numVehicles: "0" }, TODAY)
        .numVehicles,
    ).toBeDefined();
    expect(
      validateBookingForm({ ...VALID_INPUT, numVehicles: "-2" }, TODAY)
        .numVehicles,
    ).toBeDefined();
    expect(
      validateBookingForm({ ...VALID_INPUT, numVehicles: "2.5" }, TODAY)
        .numVehicles,
    ).toBeDefined();
    expect(
      validateBookingForm({ ...VALID_INPUT, numVehicles: "" }, TODAY)
        .numVehicles,
    ).toBeDefined();
  });

  it("rejects a preferred date in the past but accepts today", () => {
    expect(
      validateBookingForm(
        { ...VALID_INPUT, preferredDate: "2026-07-19" },
        TODAY,
      ).preferredDate,
    ).toBeDefined();
    expect(
      validateBookingForm(
        { ...VALID_INPUT, preferredDate: "2026-07-20" },
        TODAY,
      ).preferredDate,
    ).toBeUndefined();
  });
});

describe("defaultNumVehiclesFor", () => {
  it("defaults to 1 for Private Vehicle Owner and empty otherwise", () => {
    expect(defaultNumVehiclesFor("Private Vehicle Owner")).toBe("1");
    expect(defaultNumVehiclesFor("Truck and Transportation Fleet")).toBe("");
    expect(defaultNumVehiclesFor("")).toBe("");
  });
});

describe("option lists", () => {
  it("has exactly the 11 customer types and 8 vehicle types from the customer doc", () => {
    expect(CUSTOMER_TYPE_OPTIONS).toHaveLength(11);
    expect(VEHICLE_TYPE_OPTIONS).toHaveLength(8);
    expect(CUSTOMER_TYPE_OPTIONS).toContain("Private Vehicle Owner");
    expect(VEHICLE_TYPE_OPTIONS).toContain("Mixed Fleet");
  });
});
