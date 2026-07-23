export const CUSTOMER_TYPE_OPTIONS = [
  "Truck and Transportation Fleet",
  "Car-Rental Company",
  "Delivery Company",
  "Private Vehicle Owner",
  "School Transportation",
  "Construction Fleet",
  "Corporate Vehicles",
  "Taxi Fleet",
  "Heavy Equipment",
  "Emergency or Service Vehicles",
  "Other",
] as const;

export const VEHICLE_TYPE_OPTIONS = [
  "Cars",
  "Trucks",
  "Vans",
  "Buses",
  "Motorcycles",
  "Heavy Equipment",
  "Mixed Fleet",
  "Other",
] as const;

export type CustomerType = (typeof CUSTOMER_TYPE_OPTIONS)[number];
export type VehicleType = (typeof VEHICLE_TYPE_OPTIONS)[number];

export interface BookingFormInput {
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  customerType: CustomerType | "";
  numVehicles: string;
  vehicleType: VehicleType | "";
  preferredArea: string;
  preferredDate: string;
  message: string;
}

export interface BookingFormErrors {
  fullName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  customerType?: string;
  numVehicles?: string;
  vehicleType?: string;
  preferredArea?: string;
  preferredDate?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBookingForm(
  input: BookingFormInput,
  today: Date,
): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (!input.fullName.trim()) errors.fullName = "Full name is required.";
  if (!input.phone.trim()) errors.phone = "Phone number is required.";

  if (!input.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.customerType) {
    errors.customerType = "Customer type is required.";
  } else if (
    input.customerType !== "Private Vehicle Owner" &&
    !input.companyName.trim()
  ) {
    errors.companyName = "Company name is required for this customer type.";
  }

  const numVehicles = Number(input.numVehicles);
  if (
    !input.numVehicles.trim() ||
    !Number.isInteger(numVehicles) ||
    numVehicles <= 0
  ) {
    errors.numVehicles = "Number of vehicles must be a positive whole number.";
  }

  if (!input.vehicleType) errors.vehicleType = "Vehicle type is required.";
  if (!input.preferredArea.trim()) {
    errors.preferredArea = "Preferred installation area is required.";
  }

  if (!input.preferredDate) {
    errors.preferredDate = "Preferred date is required.";
  } else {
    const chosen = new Date(`${input.preferredDate}T00:00:00`);
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    if (chosen < todayMidnight) {
      errors.preferredDate = "Preferred date cannot be in the past.";
    }
  }

  return errors;
}

export function defaultNumVehiclesFor(customerType: CustomerType | ""): string {
  return customerType === "Private Vehicle Owner" ? "1" : "";
}
