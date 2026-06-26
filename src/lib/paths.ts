export function healthInformationPath(
  facilityId: string,
  patientId: string,
  encounterId: string,
  artefactId: string,
) {
  return `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/healthInformation/${artefactId}`;
}

export function encounterPath(
  facilityId: string,
  patientId: string,
  encounterId: string,
  tab = "updates",
) {
  return `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/${tab}`;
}
