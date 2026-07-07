// TEMPORARY PATCH: Remove when MedicationRequest is changed from date based to prescription based.

const ORGANIZATION_PROFILE =
  "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Organization";
const FACILITY_ID_CODE = "FI";

type FhirIdentifier = {
  system?: string;
  value?: string;
  type?: {
    coding?: Array<{ code?: string; display?: string; system?: string }>;
    text?: string;
  };
};

type FhirResource = {
  resourceType?: string;
  meta?: { profile?: string[] };
  identifier?: FhirIdentifier | FhirIdentifier[];
};

type FhirBundleEntry = {
  resource?: FhirResource;
};

export type FhirBundle = {
  entry?: FhirBundleEntry[];
};

function getOrganizationFromBundle(
  bundle: FhirBundle,
): FhirResource | undefined {
  return bundle.entry?.find(
    (entry) =>
      entry.resource?.resourceType === "Organization" ||
      entry.resource?.meta?.profile?.includes(ORGANIZATION_PROFILE),
  )?.resource;
}

function getFacilityIdIdentifier(
  organization: FhirResource,
): FhirIdentifier | undefined {
  const identifiers = Array.isArray(organization.identifier)
    ? organization.identifier
    : organization.identifier
      ? [organization.identifier]
      : [];

  return identifiers.find((identifier) =>
    identifier.type?.coding?.some((coding) => coding.code === FACILITY_ID_CODE),
  );
}

/**
 * Skip bundles whose Organization Facility ID differs from the consent HIP.
 * Allow when the identifier is missing or matches the consent HIP.
 */
export function shouldIncludeHiBundle(
  bundle: FhirBundle,
  consentHip: string | null | undefined,
): boolean {
  if (!consentHip) {
    return true;
  }

  const organization = getOrganizationFromBundle(bundle);
  if (!organization) {
    return true;
  }

  const facilityIdentifier = getFacilityIdIdentifier(organization);
  if (!facilityIdentifier?.value) {
    return true;
  }

  return facilityIdentifier.value === consentHip;
}
